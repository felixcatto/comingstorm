import { createEffect, createStore } from 'effector';
import {
  IActions,
  IDeleteSessionResponse,
  IPostSessionResponse,
  ISession,
  IUserLoginCreds,
} from '../../lib/types.js';
import { asyncStates, makeSessionInfo } from '../lib/utils.js';

type ISignIn = (arg: IUserLoginCreds) => Promise<IPostSessionResponse>;
type ISignOut = () => Promise<IDeleteSessionResponse>;
export const makeSessionActions = ({ getApiUrl, axios }) => ({
  signIn: createEffect<ISignIn>(async userCredentials =>
    axios({ method: 'post', url: getApiUrl('session'), data: userCredentials })
  ),
  signOut: createEffect<ISignOut>(async () =>
    axios({ method: 'delete', url: getApiUrl('session') })
  ),
});

export const makeSession = (
  actions: IActions,
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
    .on(actions.signOut.done, (state, { result }) => ({
      ...makeSessionInfo(result.currentUser),
      status: asyncStates.resolved,
      errors: null,
    }));
