import WebSocket from 'ws';
import { startServer, closeServer } from '../services/webSocketServer/main';
import { makeEnum, makeSignature, wsEvents } from '../lib/utils';
import { waitForSocketState } from '../lib/utils';
import usersFixture from './fixtures/users';
import makeKeygrip from 'keygrip';
import { makeWsClient } from '../lib/wsServerClient';

describe('wss', () => {
  const keys = process.env.KEYS!.split(',');
  const keygrip = makeKeygrip(keys);

  beforeAll(async () => {
    await startServer();
  });

  it('reflect data', async () => {
    const client = makeWsClient(process.env.NEXT_PUBLIC_WSS_URL);
    const testMessage = 'This is a test message';
    let responseMessage;
    client.on(wsEvents.echo, message => {
      responseMessage = message;
      client.close();
    });

    await waitForSocketState(client.socket, client.socket.OPEN);
    client.emit(wsEvents.echo, testMessage);
    await waitForSocketState(client.socket, client.socket.CLOSED);

    expect(responseMessage).toBe(testMessage);
  });

  it('broadcast signedIn users', async () => {
    const [user] = usersFixture;
    const client1 = makeWsClient(process.env.NEXT_PUBLIC_WSS_URL);
    const client2 = makeWsClient(process.env.NEXT_PUBLIC_WSS_URL);

    let signedInUsersIds1;
    let signedInUsersIds2;
    client1.on(wsEvents.signedInUsersIds, payload => {
      signedInUsersIds1 = payload;
    });
    client2.on(wsEvents.signedInUsersIds, payload => {
      signedInUsersIds2 = payload;
    });

    await waitForSocketState(client1.socket, client1.socket.OPEN);
    await waitForSocketState(client2.socket, client2.socket.OPEN);
    client1.emit(wsEvents.signIn, {
      cookieName: 'userId',
      cookieValue: user.id,
      signature: makeSignature(keygrip, 'userId', user.id),
    });
    await new Promise(resolve => setTimeout(resolve, 300));

    expect(signedInUsersIds1).toMatchObject([user.id]);
    expect(signedInUsersIds2).toMatchObject([user.id]);

    client1.close();
    await waitForSocketState(client1.socket, client1.socket.CLOSED);
    await new Promise(resolve => setTimeout(resolve, 300));

    expect(signedInUsersIds2).toMatchObject([]);
  });

  it('broadcast signedOut users', async () => {
    const [vasa, tom] = usersFixture;
    const client1 = makeWsClient(process.env.NEXT_PUBLIC_WSS_URL);
    const client2 = makeWsClient(process.env.NEXT_PUBLIC_WSS_URL);

    let signedInUsersIds1;
    let signedInUsersIds2;
    client1.on(wsEvents.signedInUsersIds, payload => {
      signedInUsersIds1 = payload;
    });
    client2.on(wsEvents.signedInUsersIds, payload => {
      signedInUsersIds2 = payload;
    });

    await waitForSocketState(client1.socket, client1.socket.OPEN);
    await waitForSocketState(client2.socket, client2.socket.OPEN);
    client1.emit(wsEvents.signIn, {
      cookieName: 'userId',
      cookieValue: vasa.id,
      signature: makeSignature(keygrip, 'userId', vasa.id),
    });
    client2.emit(wsEvents.signIn, {
      cookieName: 'userId',
      cookieValue: tom.id,
      signature: makeSignature(keygrip, 'userId', tom.id),
    });
    await new Promise(resolve => setTimeout(resolve, 300));
    client1.emit(wsEvents.signOut, { id: vasa.id });
    await new Promise(resolve => setTimeout(resolve, 300));

    expect(signedInUsersIds1).toMatchObject([tom.id]);
    expect(signedInUsersIds2).toMatchObject([tom.id]);
  });

  it('notifies user about new message', async () => {
    const [vasa, tom] = usersFixture;
    const client1 = makeWsClient(process.env.NEXT_PUBLIC_WSS_URL);
    const client2 = makeWsClient(process.env.NEXT_PUBLIC_WSS_URL);

    const vasaCallback = jest.fn();
    const tomCallback = jest.fn();
    client1.on(wsEvents.newMessagesArrived, vasaCallback);
    client2.on(wsEvents.newMessagesArrived, tomCallback);

    await waitForSocketState(client1.socket, client1.socket.OPEN);
    await waitForSocketState(client2.socket, client2.socket.OPEN);
    client1.emit(wsEvents.signIn, {
      cookieName: 'userId',
      cookieValue: vasa.id,
      signature: makeSignature(keygrip, 'userId', vasa.id),
    });
    client2.emit(wsEvents.signIn, {
      cookieName: 'userId',
      cookieValue: tom.id,
      signature: makeSignature(keygrip, 'userId', tom.id),
    });
    await new Promise(resolve => setTimeout(resolve, 300));
    client1.emit(wsEvents.notifyNewMessage, { receiverId: tom.id, senderId: vasa.id });
    await new Promise(resolve => setTimeout(resolve, 300));

    expect(vasaCallback.mock.calls).toHaveLength(0);
    expect(tomCallback.mock.calls).toHaveLength(1);
    const calledArg = tomCallback.mock.calls[0][0];
    expect(calledArg).toMatchObject({ senderId: vasa.id });
  });

  afterAll(closeServer);
});
