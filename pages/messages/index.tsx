import cn from 'classnames';
import { useStore } from 'effector-react';
import { isNull } from 'lodash-es';
import Textarea from 'react-textarea-autosize';
import Layout from '../../client/common/Layout.js';
import { Select } from '../../client/components/Select.js';
import {
  fmtISO,
  socketStates,
  unwrap,
  useContext,
  useImmerState,
  useRefreshPage,
  wsEvents,
} from '../../client/lib/utils.js';
import { keygrip, objection } from '../../lib/init.js';
import { IMessage, IUser, IUserWithAvatar } from '../../lib/types.js';
import { getUserFromRequest } from '../../lib/utils.js';
import s from './styles.module.css';

type IMessagesProps = {
  messages: IMessage[];
  users: IUser[];
};

type IGetUserInfoArgs = {
  messages: IMessage[];
  users: IUser[];
  currentUser: IUserWithAvatar;
  usersWantedToChatWith: IUser[];
};

const getUsersInfo = ({
  messages,
  users,
  currentUser,
  usersWantedToChatWith,
}: IGetUserInfoArgs) => {
  const usersIdsWantedToChatWith = new Set();
  const chattedUsersIds = new Set();
  usersWantedToChatWith.forEach(el => usersIdsWantedToChatWith.add(el.id));
  messages.forEach(el =>
    el.receiver_id === currentUser.id
      ? chattedUsersIds.add(el.sender_id)
      : chattedUsersIds.add(el.receiver_id)
  );
  const chattedFriends = users.filter(el => chattedUsersIds.has(el.id));
  const contactsOrder = new Set();
  messages.forEach(el =>
    currentUser.id === el.sender_id
      ? contactsOrder.add(el.receiver_id)
      : contactsOrder.add(el.sender_id)
  );
  const orderedChattedFriends = [] as IUser[];
  contactsOrder.forEach(contactId => {
    const chattedFriend = chattedFriends.find(el => el.id === contactId)!;
    orderedChattedFriends.push(chattedFriend);
  });
  const usersAvailbleToChat = users.filter(
    el =>
      !chattedUsersIds.has(el.id) &&
      !usersIdsWantedToChatWith.has(el.id) &&
      el.id !== currentUser.id
  );
  return [orderedChattedFriends, usersAvailbleToChat];
};

export async function getServerSideProps({ req, res }) {
  const { Message, User } = objection;
  const currentUser = await getUserFromRequest(res, req.cookies, keygrip, User);
  const messages = await Message.query()
    .withGraphFetched('[receiver.avatar, sender.avatar]')
    .where('receiver_id', '=', currentUser.id)
    .orWhere('sender_id', '=', currentUser.id)
    .orderBy('created_at', 'desc');

  const users = await User.query().withGraphFetched('avatar');
  return {
    props: unwrap({ currentUser, messages, users }),
  };
}

type IState = {
  usersWantedToChatWith: IUser[];
  selectedFriendId: number | null;
  inputValue: string;
  messageInputHeight: number;
  newlySendedMessages: IMessage[];
  isMessageSending: boolean;
  editingMessageId: number | null;
};

const Messages = ({ messages, users }: IMessagesProps) => {
  const { $session, getApiUrl, axios, $signedInUsersIds, $ws } = useContext();
  const refreshPage = useRefreshPage();
  const { isSignedIn, currentUser } = useStore($session);
  const { wsClient, webSocketState } = useStore($ws);
  const signedInUsersIds = useStore($signedInUsersIds);
  const [state, setState] = useImmerState<IState>({
    usersWantedToChatWith: [],
    selectedFriendId: null,
    inputValue: '',
    newlySendedMessages: [],
    messageInputHeight: 0,
    isMessageSending: false,
    editingMessageId: null,
  });
  const {
    usersWantedToChatWith,
    selectedFriendId,
    inputValue,
    newlySendedMessages,
    messageInputHeight,
    isMessageSending,
    editingMessageId,
  } = state;

  const getFriendDialog = friendId => {
    if (isNull(friendId)) return [];
    const dialogIds = [currentUser.id, friendId];
    return newlySendedMessages
      .concat(messages)
      .filter(el => dialogIds.includes(el.sender_id) && dialogIds.includes(el.receiver_id));
  };

  const getLastDialogMessage = friendId => {
    const [lastMessage] = getFriendDialog(friendId);
    return lastMessage?.text || '';
  };

  const [chattedFriends, usersAvailbleToChat] = getUsersInfo({
    messages,
    users,
    currentUser,
    usersWantedToChatWith,
  });

  const contacts = usersWantedToChatWith.concat(chattedFriends);
  const dialog = getFriendDialog(selectedFriendId);
  const transformToSelect = usersArray =>
    usersArray.map(el => ({ ...el, value: el.id, label: el.name }));

  const onNewMessageChange = e => {
    const { value } = e.target;
    setState({ inputValue: value });
  };
  const onNewMessageKeydown = async e => {
    const isUserWantSendMessage = e.code === 'Enter' && e.shiftKey === false;
    if (!isUserWantSendMessage) return;

    e.preventDefault();
    const { value } = e.target;
    if (value === '') return;

    const newMessageBody = { text: value, receiver_id: selectedFriendId };
    if (editingMessageId) {
      setState({ inputValue: '', editingMessageId: null, isMessageSending: true });
      const editedMessage = await axios.put(
        getApiUrl('message', { id: editingMessageId }),
        newMessageBody
      );
      setState({ isMessageSending: false });
      refreshPage();
    } else {
      setState({ inputValue: '', isMessageSending: true });
      const newMessage = await axios.post(getApiUrl('messages'), newMessageBody);
      setState({ isMessageSending: false, usersWantedToChatWith: [] });
      refreshPage();
      if (webSocketState === socketStates.open) {
        wsClient!.emit(wsEvents.notifyNewMessage, {
          receiverId: newMessageBody.receiver_id,
          senderId: currentUser.id,
        });
      }
    }
  };

  const selectNewUserToChat: any = (user: IUser) => {
    setState({
      usersWantedToChatWith: usersWantedToChatWith.concat(user),
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
  const deleteMessage = id => async () => {
    await axios.delete(getApiUrl('message', { id }));
    refreshPage();
  };

  const selectFriendToChat = friendId => () =>
    setState({ selectedFriendId: friendId, isMessageSending: false });
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
                          onClick={deleteMessage(el.id)}
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
