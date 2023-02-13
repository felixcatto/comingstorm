import { createEvent, createStore } from 'effector';
import { IActions, INativeWSocketClient, INullable, ISocketState } from '../../lib/types';
import { socketStates } from '../lib/utils';

export const makeWsClientActions = () => ({
  setWsClient: createEvent<INullable<INativeWSocketClient>>(),
  updateWsState: createEvent<number>(),
  wssUpdateSignedUsers: createEvent<any[]>(),
});

export const makeWsClientStore = (actions: IActions, initialState = null) =>
  createStore<INullable<INativeWSocketClient>>(initialState).on(
    actions.setWsClient,
    (state, payload) => payload
  );

export const makeWebSocketState = (actions: IActions, initialState = socketStates.unset) =>
  createStore<ISocketState>(initialState)
    .on(actions.setWsClient, (state, wsClient) =>
      wsClient ? socketStates.connecting : socketStates.unset
    )
    .on(actions.updateWsState, (state, wsReadyState) => {
      if (wsReadyState === 1) {
        return socketStates.open;
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
