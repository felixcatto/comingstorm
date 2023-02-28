import WebSocket from 'ws';
import { IWSClient, IWsEvent, IWsGeneralEvent } from './types.js';
import { decode, encode, wsGeneralEvents } from './utils.js';

export const makeWsClient = url => {
  const wsEventHandlers = {} as any;
  const wsClient = {} as IWSClient;
  const socket = new WebSocket(url);

  wsClient.socket = socket;
  wsClient.on = (wsEvent: IWsEvent | IWsGeneralEvent, fn) => {
    if (Object.keys(wsGeneralEvents).includes(wsEvent)) {
      socket.on(wsEvent, fn);
    } else {
      wsEventHandlers[wsEvent] = fn;
    }
  };
  wsClient.emit = (wsEvent: IWsEvent, message = '') => {
    socket.send(encode(wsEvent, message));
  };
  wsClient.close = () => socket.close();

  socket.on('message', msgBuffer => {
    const { type, payload } = decode(msgBuffer);
    const handler = wsEventHandlers[type];
    if (!handler) {
      console.log(`
        receive event with type "${type}", but have no handler
        -> ${payload}
      `);
      return;
    }
    handler(payload);
  });

  return wsClient;
};
