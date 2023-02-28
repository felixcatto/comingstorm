import fy, { FastifyInstance } from 'fastify';
import fastifyWs from '@fastify/websocket';
import makeKeygrip from 'keygrip';
import { decode, encode, wsEvents, verifySignature, findKeyByValue } from '../../lib/utils';
import cookie from 'cookie';
import { WebSocket } from 'ws';

type UsedID = number;
type ISignedInUsers = Map<UsedID, WebSocket>;

const keys = process.env.KEYS!.split(',');
const keygrip = makeKeygrip(keys);

const wss = async (fastify: FastifyInstance) => {
  const signedInUsers: ISignedInUsers = new Map();
  const getUsersIds = userSockets => Array.from(userSockets.keys());

  fastify.get('/', { websocket: true }, (connection, req) => {
    console.log('wss: client connected');
    const broadcast = (eventType, payload) => {
      fastify.websocketServer.clients.forEach(socket => {
        socket.send(encode(eventType, payload));
      });
    };
    const getUserInfo = () => {
      const guestInfo = { userId: null, isSignedIn: false };
      if (!req.headers.cookie) return guestInfo;
      const { userId, userIdSig } = cookie.parse(req.headers.cookie) || {};
      if (!userId || !userIdSig) return guestInfo;
      const isSignatureCorrect = verifySignature(keygrip, 'userId', userId, userIdSig);
      return { userId: Number(userId), isSignedIn: isSignatureCorrect };
    };

    const userInfo = getUserInfo();
    if (userInfo.isSignedIn) {
      const userId = userInfo.userId!;
      signedInUsers.set(userId, connection.socket);
      broadcast(wsEvents.signedInUsersIds, getUsersIds(signedInUsers));
    }

    connection.socket.on('message', msgBuffer => {
      const { type, payload } = decode(msgBuffer);
      switch (type) {
        case wsEvents.echo:
          connection.socket.send(encode(wsEvents.echo, payload));
          break;
        case wsEvents.signIn:
          const { cookieName, cookieValue, signature } = payload;
          const isSignatureCorrect = verifySignature(keygrip, cookieName, cookieValue, signature);
          if (isSignatureCorrect) {
            const userId = cookieValue;
            signedInUsers.set(userId, connection.socket);
            broadcast(wsEvents.signedInUsersIds, getUsersIds(signedInUsers));
          }
          break;
        case wsEvents.signOut:
          const { id } = payload;
          signedInUsers.delete(id);
          broadcast(wsEvents.signedInUsersIds, getUsersIds(signedInUsers));
          break;
        case wsEvents.getSignedInUsersIds:
          connection.socket.send(encode(wsEvents.signedInUsersIds, getUsersIds(signedInUsers)));
          break;
        case wsEvents.notifyNewMessage:
          const { receiverId, senderId } = payload;
          const receiverSocket = signedInUsers.get(receiverId);
          if (!receiverSocket) return;
          receiverSocket.send(encode(wsEvents.newMessagesArrived, { senderId }));
          break;
        default:
          connection.socket.send(
            encode(wsEvents.error, `message with type "${type}" is not supported`)
          );
      }
    });

    connection.socket.on('close', () => {
      console.log('wss: client disconnected');
      const userId = findKeyByValue(signedInUsers, connection.socket);
      signedInUsers.delete(userId!);
      broadcast(wsEvents.signedInUsersIds, getUsersIds(signedInUsers));
    });
  });
};
const healthCheck = async (fastify: FastifyInstance) => {
  fastify.get('/health', async (requst, reply) => reply.code(200).send('hi'));
};

const fastify = fy();
fastify.register(fastifyWs, {
  errorHandler: (error, conn) => {
    console.log(error);
    conn.destroy(error);
  },
  options: { clientTracking: true },
});
fastify.register(wss);
fastify.register(healthCheck);

const startServer = async (opts?) =>
  new Promise(resolve => {
    const port = opts?.port || process.env.WSS_PORT;
    fastify.listen({ port }, (err, address) => {
      if (err) {
        console.log(err);
        process.exit(1);
      }
      resolve(fastify);
    });
  });
const closeServer = async () => fastify.close();

export { closeServer, startServer };
