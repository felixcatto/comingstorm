import { createEvent, createStore } from 'effector';
import { IActions, INativeWSocketClient, INullable, ISocketState } from '../../lib/types.js';
import { socketStates } from '../lib/utils.js';

export const makeWsClientActions = () => ({
  setWsClient: createEvent<INullable<INativeWSocketClient>>(),
  updateWsState: createEvent<number>(),
  wssUpdateSignedUsers: createEvent<any[]>(),
});

type IWsInitialState = {
  wsClient: INativeWSocketClient | null;
  webSocketState: ISocketState;
};
const wsInitialState: IWsInitialState = {
  wsClient: null,
  webSocketState: socketStates.unset,
};
export const makeWs = (actions: IActions, initialState = wsInitialState) =>
  createStore(initialState)
    .on(actions.setWsClient, (state, wsClient) => ({
      wsClient,
      webSocketState: wsClient ? socketStates.connecting : socketStates.closed,
    }))
    .on(actions.updateWsState, (state, wsReadyState) => {
      if (wsReadyState === 1) {
        return { ...state, webSocketState: socketStates.open };
      } else {
        return state;
      }
    });

export const makeSignedInUsersIds = (actions: IActions, initialState = []) =>
  createStore<any[]>(initialState).on(actions.wssUpdateSignedUsers, (state, payload) => {
    if (state.length !== payload.length) return payload;
    const istate = [...state].sort();
    const ipayload = payload.sort();
    const isIdsEqual = istate.every((_, i) => istate[i] === ipayload[i]);
    return isIdsEqual ? state : payload;
  });
