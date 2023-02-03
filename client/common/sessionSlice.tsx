import { createEffect, createStore } from 'effector';
import { asyncStates, IAsyncState, makeSessionInfo } from '../lib/utils';
import { IUserLoginCreds } from '../../models/User';
import { IUser } from '../../models/User';

type ISession = {
  currentUser: IUser;
  isAdmin: boolean;
  isSignedIn: boolean;
  isBelongsToUser: (resourceAuthorId: string) => boolean;
  status: IAsyncState;
  errors: any;
};

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

export type ISessionActions = ReturnType<typeof makeSessionActions>;
export type ISessionStore = ReturnType<typeof makeSession>;
