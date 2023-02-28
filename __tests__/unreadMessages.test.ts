import originalAxios, { AxiosError } from 'axios';
import { objection } from '../lib/init.js';
import { getApiUrl } from '../lib/sharedUtils.js';
import messagesFixture from './fixtures/messages.js';
import usersFixture from './fixtures/users.js';
import { getLoginOptions } from './fixtures/utils.js';
import avatarsFixture from './fixtures/avatars.js';
import unreadMessagesFixture from './fixtures/unreadMessages.js';

describe('messages', () => {
  const baseURL = process.env.HTTP_SERVER_URL;
  const axios = originalAxios.create({ baseURL });
  const { User, Message, Avatar, UnreadMessage } = objection;
  let loginOptions;

  beforeAll(async () => {
    await Avatar.query().delete();
    await User.query().delete();
    await Avatar.query().insertGraph(avatarsFixture);
    await User.query().insertGraph(usersFixture as any);
    loginOptions = await getLoginOptions(axios, getApiUrl);
  });

  beforeEach(async () => {
    await UnreadMessage.query().delete();
    await Message.query().delete();
    await Message.query().insertGraph(messagesFixture);
  });

  it('DELETE /api/unread-messages?sender_id&receiver_id removes unread messages from sender_id', async () => {
    const [msg1, msg2] = unreadMessagesFixture;
    const { sender_id, receiver_id } = msg1;
    await UnreadMessage.query().insertGraph(unreadMessagesFixture);
    const res = await axios.delete(
      getApiUrl('unreadMessages', {}, { sender_id, receiver_id }),
      loginOptions
    );

    const messagesFromDb = await UnreadMessage.query().where({ sender_id, receiver_id });
    expect(res.status).toBe(201);
    expect(messagesFromDb).toHaveLength(0);
  });

  it('POST /api/messages makes unread message', async () => {
    const [vasa] = usersFixture;
    const fedyaId = -3;
    const message = {
      text: 'ggwp lanaya',
      receiver_id: fedyaId,
    };
    const res = await axios.post(getApiUrl('messages'), message, loginOptions);

    const expectedMessage = { message_id: res.data.id, sender_id: vasa.id, receiver_id: fedyaId };
    const messageFromDb = await UnreadMessage.query().findOne(
      'message_id',
      expectedMessage.message_id
    );
    expect(res.status).toBe(201);
    expect(messageFromDb).toMatchObject(expectedMessage);
  });

  it('PUT /api/messages/:id makes unread message', async () => {
    const tomsMessage = messagesFixture[1];
    const message = {
      ...tomsMessage,
      text: '(edited)',
    };
    const [, tomUser] = usersFixture;
    const tomLoginOptions = await getLoginOptions(axios, getApiUrl, tomUser);
    const res = await axios.put(getApiUrl('message', { id: message.id }), message, tomLoginOptions);

    const expectedMessage = {
      message_id: tomsMessage.id,
      sender_id: tomsMessage.sender_id,
      receiver_id: tomsMessage.receiver_id,
    };
    const messageFromDb = await UnreadMessage.query().findOne(
      'message_id',
      expectedMessage.message_id
    );
    expect(res.status).toBe(201);
    expect(messageFromDb).toMatchObject(expectedMessage);
  });

  it('DELETE /api/messages/:id remove unread message', async () => {
    const [unreadMessage] = unreadMessagesFixture;
    const message = messagesFixture.find(el => el.id === unreadMessage.message_id)!;
    await UnreadMessage.query().insertGraph(unreadMessagesFixture);
    const res = await axios.delete(getApiUrl('message', { id: message.id }), loginOptions);
    const messageFromDb = await UnreadMessage.query().findOne(
      'message_id',
      unreadMessage.message_id
    );
    expect(res.status).toBe(201);
    expect(messageFromDb).toBeFalsy();
  });

  afterAll(async () => {
    await objection.knex.destroy();
  });
});
