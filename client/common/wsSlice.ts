import { createEvent, createStore } from 'effector';
import { IActions, INativeWebSocket, ISocketState } from '../../lib/types.js';
import { socketStates } from '../lib/utils.js';

type IWsInitialState =
  | {
      webSocket: null;
      webSocketState: typeof socketStates.unset;
    }
  | {
      webSocket: INativeWebSocket;
      webSocketState:
        | typeof socketStates.open
        | typeof socketStates.connecting
        | typeof socketStates.closed;
    };

export const makeWsClientActions = () => ({
  setWebSocket: createEvent<INativeWebSocket | null>(),
  updateWsState: createEvent<INativeWebSocket>(),
  wssUpdateSignedUsers: createEvent<any[]>(),
});

const wsInitialState: IWsInitialState = {
  webSocket: null,
  webSocketState: socketStates.unset,
};

export const makeWs = (actions: IActions, initialState: IWsInitialState = wsInitialState) =>
  createStore(initialState)
    .on(actions.setWebSocket, (state, webSocket) => {
      if (webSocket) {
        return { webSocket, webSocketState: socketStates.connecting };
      }
      return { webSocket, webSocketState: socketStates.unset };
    })
    .on(actions.updateWsState, (state, webSocket) => {
      if (webSocket.readyState === 1) {
        return { webSocket, webSocketState: socketStates.open };
      }
      return state;
    });

export const makeSignedInUsersIds = (actions: IActions, initialState = []) =>
  createStore<any[]>(initialState).on(actions.wssUpdateSignedUsers, (state, payload) => {
    if (state.length !== payload.length) return payload;
    const istate = [...state].sort();
    const ipayload = payload.sort();
    const isIdsEqual = istate.every((_, i) => istate[i] === ipayload[i]);
    return isIdsEqual ? state : payload;
  });
