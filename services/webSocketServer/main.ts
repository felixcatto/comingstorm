import fy, { FastifyInstance } from 'fastify';
import fastifyWs from '@fastify/websocket';
import makeKeygrip from 'keygrip';
import { decode, encode, wsEvents, verifySignature } from '../../lib/utils';
import cookie from 'cookie';

const keys = process.env.KEYS!.split(',');
const keygrip = makeKeygrip(keys);

const wss = async (fastify: FastifyInstance) => {
  const signedInUsersIds = new Set();

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
    let userId = null as any;
    if (userInfo.isSignedIn) {
      userId = userInfo.userId;
      signedInUsersIds.add(userId);
      broadcast(wsEvents.signedInUsersIds, Array.from(signedInUsersIds));
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
            userId = cookieValue;
            signedInUsersIds.add(userId);
            broadcast(wsEvents.signedInUsersIds, Array.from(signedInUsersIds));
          }
          break;
        case wsEvents.signOut:
          const { id } = payload;
          userId = null;
          signedInUsersIds.delete(id);
          broadcast(wsEvents.signedInUsersIds, Array.from(signedInUsersIds));
          break;
        case wsEvents.getSignedInUsersIds:
          broadcast(wsEvents.signedInUsersIds, Array.from(signedInUsersIds));
          break;
        default:
          connection.socket.send(
            encode(wsEvents.error, `message with type "${type}" is not supported`)
          );
      }
    });

    connection.socket.on('close', () => {
      console.log('wss: client disconnected');
      signedInUsersIds.delete(userId);
      userId = null;
      broadcast(wsEvents.signedInUsersIds, Array.from(signedInUsersIds));
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
