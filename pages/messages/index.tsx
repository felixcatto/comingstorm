import cn from 'classnames';
import { useStore } from 'effector-react';
import { isNull } from 'lodash-es';
import React from 'react';
import Textarea from 'react-textarea-autosize';
import Layout from '../../client/common/Layout.js';
import { Select } from '../../client/components/Select.js';
import {
  decode,
  fmtISO,
  isSignedIn,
  send,
  socketStates,
  unwrap,
  useContext,
  useImmerState,
  useRefreshPage,
  wsEvents,
} from '../../client/lib/utils.js';
import { getUsersInfo } from '../../client/messages/utils.js';
import { keygrip, objection } from '../../lib/init.js';
import { IMessage, IUnreadMessagesDict, IUser } from '../../lib/types.js';
import { getUserFromRequest } from '../../lib/utils.js';
import s from './styles.module.css';

type IMessagesProps = {
  messages: IMessage[];
  users: IUser[];
};

export async function getServerSideProps({ req, res }) {
  const { Message, User } = objection;
  const currentUser = await getUserFromRequest(res, req.cookies, keygrip, User);
  let unreadMessages: any = [];
  if (isSignedIn(currentUser)) {
    unreadMessages = await objection.UnreadMessage.query().where('receiver_id', currentUser.id);
  }
  const messages = await Message.query()
    .withGraphFetched('[receiver.avatar, sender.avatar]')
    .where('receiver_id', '=', currentUser.id)
    .orWhere('sender_id', '=', currentUser.id)
    .orderBy('created_at', 'desc');

  const users = await User.query().withGraphFetched('avatar');
  return {
    props: unwrap({ currentUser, messages, users, unreadMessages }),
  };
}

type IState = {
  usersNewlySelectedToChat: IUser[];
  selectedFriendId: number | null;
  inputValue: string;
  messageInputHeight: number;
  isMessageSending: boolean;
  editingMessageId: number | null;
};

const Messages = ({ messages, users }: IMessagesProps) => {
  const { $session, getApiUrl, axios, $signedInUsersIds, $ws, unreadMessages } = useContext();
  const refreshPage = useRefreshPage();
  const { isSignedIn, currentUser } = useStore($session);
  const { webSocket, webSocketState } = useStore($ws);
  const signedInUsersIds = useStore($signedInUsersIds);
  const [state, setState] = useImmerState<IState>({
    usersNewlySelectedToChat: [],
    selectedFriendId: null,
    inputValue: '',
    messageInputHeight: 0,
    isMessageSending: false,
    editingMessageId: null,
  });
  const {
    usersNewlySelectedToChat,
    selectedFriendId,
    inputValue,
    messageInputHeight,
    isMessageSending,
    editingMessageId,
  } = state;

  const getFriendDialog = friendId => {
    if (isNull(friendId)) return [];
    const dialogIds = [currentUser.id, friendId];
    return messages.filter(
      el => dialogIds.includes(el.sender_id) && dialogIds.includes(el.receiver_id)
    );
  };

  const getLastDialogMessage = friendId => {
    const [lastMessage] = getFriendDialog(friendId);
    return lastMessage?.text || '';
  };

  const [contacts, usersAvailbleToChat] = getUsersInfo({
    messages,
    users,
    currentUser,
    usersNewlySelectedToChat,
  });

  const dialog = getFriendDialog(selectedFriendId);
  const transformToSelect = usersArray =>
    usersArray.map(el => ({ ...el, value: el.id, label: el.name }));

  const unreadMessagesDict = unreadMessages.reduce((acc, message) => {
    const msgCount = acc[message.sender_id]?.msgCount ?? 0;
    return { ...acc, [message.sender_id]: { msgCount: msgCount + 1 } };
  }, {} as IUnreadMessagesDict);

  const onNewMessageChange = e => {
    const { value } = e.target;
    setState({ inputValue: value });
  };

  const onNewMessageKeydown = async e => {
    const isUserWantSendMessage = e.code === 'Enter' && e.shiftKey === false;
    if (!isUserWantSendMessage) return;

    e.preventDefault(); // stop resize textarea
    const { value } = e.target;
    if (value === '') return;

    const newMessageBody = { text: value, receiver_id: selectedFriendId };
    if (editingMessageId) {
      setState({ inputValue: '', editingMessageId: null, isMessageSending: true });
      await axios.put(getApiUrl('message', { id: editingMessageId }), newMessageBody);
    } else {
      setState({ inputValue: '', isMessageSending: true });
      await axios.post(getApiUrl('messages'), newMessageBody);
    }

    setState({ isMessageSending: false });

    if (webSocketState === socketStates.open) {
      send(webSocket, wsEvents.notifyNewMessage, {
        receiverId: newMessageBody.receiver_id,
        senderId: currentUser.id,
      });
    }
    refreshPage();
  };

  const selectNewUserToChat: any = (user: IUser) => {
    setState({
      usersNewlySelectedToChat: usersNewlySelectedToChat.concat(user),
      selectedFriendId: user.id,
      isMessageSending: false,
    });
  };

  const editMessage = (message: IMessage) => () =>
    setState({
      editingMessageId: message.id,
      inputValue: message.text,
      isMessageSending: false,
    });
  const onCancelEditMessage = () => setState({ editingMessageId: null, inputValue: '' });
  const deleteMessage = (id, receiverId) => async () => {
    await axios.delete(getApiUrl('message', { id }));
    if (webSocketState === socketStates.open) {
      send(webSocket, wsEvents.notifyNewMessage, { receiverId, senderId: currentUser.id });
    }
    refreshPage();
  };

  const selectFriendToChat = friendId => async () => {
    setState({ selectedFriendId: friendId, isMessageSending: false });
    if (unreadMessagesDict[friendId]) {
      await axios.delete(
        getApiUrl('unreadMessages', {}, { receiver_id: currentUser.id, sender_id: friendId })
      );
      refreshPage();
    }
  };

  const friendClass = id =>
    cn(s.friendToChat, { [s.friendToChat_selected]: id === selectedFriendId });
  const friendNameClass = id =>
    cn(s.friendName, { [s.friendName_selected]: id === selectedFriendId });
  const onlineIconClass = friendId =>
    cn('online-icon online-icon_online online-icon_sm ml-2', {
      'online-icon_shadow-white': friendId === selectedFriendId,
    });
  const messageContentClass = senderId =>
    cn(s.messageContent, { [s.messageContent_own]: senderId === currentUser.id });
  const messageAuthorClass = senderId =>
    cn(s.messageAuthor, { [s.messageAuthor_own]: senderId === currentUser.id });
  const messageInputClass = cn('form-control form-control_secondary', s.messageInput, {
    [s.messageInput_editMode]: !isNull(editingMessageId),
  });

  React.useEffect(() => {
    if (!webSocket) return;
    if (isNull(selectedFriendId)) return;

    // on newMessagesArrived we need refreshUnreadMsgs() & refreshMessages()
    // but both of this handled via refreshPage in WssConnect,
    //   although it only wants refreshUnreadMsgs()
    const removeUnreadMessages = async wsData => {
      const { type, payload } = decode(wsData);
      if (wsEvents.newMessagesArrived !== type) return;

      const isNewMessageInActiveChat = payload.senderId === selectedFriendId;
      if (!isNewMessageInActiveChat) return;

      const data = { receiver_id: currentUser.id, sender_id: selectedFriendId };
      await axios.delete(getApiUrl('unreadMessages', {}, data));
      refreshPage();
    };

    webSocket.addEventListener('message', removeUnreadMessages);
    return () => webSocket.removeEventListener('message', removeUnreadMessages);
  }, [webSocket, selectedFriendId]);

  if (!isSignedIn) return <Layout>403 frobidden</Layout>;

  return (
    <Layout>
      <div className="row h-full">
        <div className="col-4">
          <div className="mb-6">
            <Select
              data={transformToSelect(usersAvailbleToChat)}
              onSelect={selectNewUserToChat}
              shouldClearOnSelect
              itemComponent={({ item, isSelected }) => (
                <div className="flex">
                  <div className="w-16 mr-2">
                    <img src={item.avatar.path} />
                  </div>
                  <div>
                    <div className="text-lg">{item.name}</div>
                    <div className={cn('text-sm', { 'text-slate-500': !isSelected })}>
                      {item.email}
                    </div>
                  </div>
                </div>
              )}
            />
          </div>

          <div>
            {contacts.map(el => (
              <div className={friendClass(el.id)} key={el.id} onClick={selectFriendToChat(el.id)}>
                <div className="w-16 mr-2 flex-none">
                  <img src={el.avatar!.path} />
                </div>
                <div>
                  <div className="flex items-center">
                    <div className={friendNameClass(el.id)}>{el.name}</div>
                    {signedInUsersIds.includes(el.id) && <i className={onlineIconClass(el.id)}></i>}
                    {unreadMessagesDict[el.id] && (
                      <div className="flex-1 flex pr-1 justify-end">
                        <div
                          className={cn('msg-count', {
                            'msg-count_inverse': el.id === selectedFriendId,
                          })}
                        >
                          {unreadMessagesDict[el.id].msgCount}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className={s.friendLastMessage}>{getLastDialogMessage(el.id)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="col-8">
          <div className={s.messages}>
            {isNull(selectedFriendId) && (
              <div className={s.messagesPlaceholder}>Select chat to start messaging</div>
            )}

            {!isNull(selectedFriendId) && (
              <div className={s.messageInputWrap} style={{ height: messageInputHeight }}>
                {editingMessageId && (
                  <div className={s.messageInputControls}>
                    <div className="flex items-center">
                      <i className="fa fa-pen fa_secondary"></i>
                      <div className="ml-2 text-sm text-secondary">Edit message</div>
                    </div>
                    <i
                      className="far fa-circle-xmark fa_big fa_link text-lg"
                      onClick={onCancelEditMessage}
                    ></i>
                  </div>
                )}
                {isMessageSending && (
                  <div className={cn('spinner spinner_sm', s.messageSpinner)}></div>
                )}
                <Textarea
                  className={messageInputClass}
                  placeholder="Write a message..."
                  onKeyDown={onNewMessageKeydown}
                  onChange={onNewMessageChange}
                  value={inputValue}
                  onHeightChange={height => setState({ messageInputHeight: height })}
                />
              </div>
            )}

            {dialog.map(el => (
              <div className="flex mb-2" key={el.id}>
                <div className="w-16 mr-1 flex items-end flex-none">
                  <img src={el.sender?.avatar?.path} />
                </div>
                <div className={messageContentClass(el.sender_id)}>
                  <div className="flex items-center">
                    <div className={messageAuthorClass(el.sender_id)}>{el.sender?.name}</div>
                    <div className="ml-3 text-xs text-slate-500">
                      {fmtISO(el.updated_at, 'dd MMM HH:mm')}
                    </div>
                    {el.sender_id === currentUser.id && (
                      <div className="ml-3 flex">
                        <i
                          className={cn('fa fa-edit fa_big fa_link', s.messageIcon)}
                          title="edit"
                          onClick={editMessage(el)}
                        ></i>
                        <i
                          className={cn('fa fa-trash-alt fa_big fa_link ml-1', s.messageIcon)}
                          title="delete"
                          onClick={deleteMessage(el.id, el.receiver_id)}
                        ></i>
                      </div>
                    )}
                  </div>
                  <div>{el.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Messages;
