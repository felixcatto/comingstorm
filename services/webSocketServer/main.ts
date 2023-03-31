import fastifyWs from '@fastify/websocket';
import fy, { FastifyInstance } from 'fastify';
import makeKeygrip from 'keygrip';
import { WebSocket } from 'ws';
import { decode, encode, findKeyByValue, getUserId, wsEvents } from '../../lib/utils.js';

type UserID = number;
type ISignedInUsers = Map<UserID, WebSocket>;

const wss = async (fastify: FastifyInstance) => {
  const keys = process.env.KEYS!.split(',');
  const keygrip = makeKeygrip(keys);

  const signedInUsers: ISignedInUsers = new Map();
  const getUsersIds = userSockets => Array.from(userSockets.keys());

  fastify.get('/', { websocket: true }, (connection, req) => {
    console.log('wss: client connected');
    const broadcast = (eventType, payload) => {
      fastify.websocketServer.clients.forEach(socket => {
        socket.send(encode(eventType, payload));
      });
    };

    const userInfo = getUserId(req.headers.cookie, keygrip);
    if (userInfo.isSignatureCorrect) {
      signedInUsers.set(Number(userInfo.userId), connection.socket);
      broadcast(wsEvents.signedInUsersIds, getUsersIds(signedInUsers));
    }

    connection.socket.on('message', msgBuffer => {
      const { type, payload } = decode(msgBuffer);
      switch (type) {
        case wsEvents.echo:
          connection.socket.send(encode(wsEvents.echo, payload));
          break;
        case wsEvents.signIn:
          const { userId, signature } = payload;
          const isSignatureCorrect = keygrip.verify(String(userId), signature);

          if (isSignatureCorrect) {
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
    fastify.listen({ port }, err => {
      if (err) {
        console.log(err);
        process.exit(1);
      }
      resolve(fastify);
    });
  });
const closeServer = async () => fastify.close();

export { closeServer, startServer };
