import { createEffect, createStore } from 'effector';
import { ISession, IUserLoginCreds } from '../../lib/types';
import { asyncStates, makeSessionInfo } from '../lib/utils';

export const makeSessionActions = ({ getApiUrl, axios }) => ({
  signIn: createEffect(async (userCredentials: IUserLoginCreds) =>
    axios({ method: 'post', url: getApiUrl('session'), data: userCredentials })
  ),
  signOut: createEffect(async () => axios({ method: 'delete', url: getApiUrl('session') })),
});

export const makeSession = (
  actions,
  initialState = {
    currentUser: null,
    isAdmin: false,
    isSignedIn: false,
    isBelongsToUser: () => false,
    status: asyncStates.idle,
    errors: null,
  } as any
) =>
  createStore<ISession>(initialState)
    .on(actions.signIn, state => ({
      ...state,
      status: asyncStates.pending,
      errors: null,
    }))
    .on(actions.signIn.done, (state, { result: currentUser }) => ({
      ...makeSessionInfo(currentUser),
      status: asyncStates.resolved,
      errors: null,
    }))
    .on(actions.signOut.done, (state, { result: currentUser }) => ({
      ...makeSessionInfo(currentUser),
      status: asyncStates.resolved,
      errors: null,
    }));
