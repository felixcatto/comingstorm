import { createEffect, createEvent, createStore } from 'effector';
import {
  IActions,
  IAsyncState,
  ICurrentUserStore,
  IDeleteSessionResponse,
  IPostSessionResponse,
  IUserLoginCreds,
  IUserWithAvatar,
} from '../../lib/types.js';
import {
  asyncStates,
  getApiUrl,
  guestUser,
  isAdmin,
  isBelongsToUser,
  isSignedIn,
} from '../lib/utils.js';

type ISignIn = (arg: IUserLoginCreds) => Promise<IPostSessionResponse>;
type ISignOut = () => Promise<IDeleteSessionResponse>;

type ICurrentUserInitialState = {
  data: IUserWithAvatar;
  status: IAsyncState;
  errors: object | null;
};

export const makeActions = ({ axios }) => ({
  signIn: createEffect<ISignIn>(async userCredentials =>
    axios({ method: 'post', url: getApiUrl('session'), data: userCredentials })
  ),
  signOut: createEffect<ISignOut>(async () =>
    axios({ method: 'delete', url: getApiUrl('session') })
  ),
  wssUpdateSignedUsers: createEvent<any[]>(),
});

export const currentUserInitialState = {
  data: guestUser,
  status: asyncStates.idle,
  errors: null,
};

export const makeCurrentUser = (
  actions: IActions,
  initialState: ICurrentUserInitialState = currentUserInitialState
) =>
  createStore(initialState)
    .on(actions.signIn, state => ({
      ...state,
      status: asyncStates.pending,
      errors: null,
    }))
    .on(actions.signIn.done, (state, { result }) => ({
      data: result,
      status: asyncStates.resolved,
      errors: null,
    }))
    .on(actions.signOut.done, (state, { result }) => ({
      data: result.currentUser,
      status: asyncStates.resolved,
      errors: null,
    }));

makeCurrentUser.key = '$currentUser' as const;

export const makeSignedInUsersIds = (actions: IActions, initialState: any[] = []) =>
  createStore(initialState).on(actions.wssUpdateSignedUsers, (state, payload) => {
    if (state.length !== payload.length) return payload;
    const istate = [...state].sort();
    const ipayload = payload.sort();
    const isIdsEqual = istate.every((_, i) => istate[i] === ipayload[i]);
    return isIdsEqual ? state : payload;
  });

makeSignedInUsersIds.key = '$signedInUsersIds' as const;

export const makeSession = ($currentUser: ICurrentUserStore) =>
  $currentUser.map(({ data: currentUser }) => ({
    currentUser,
    isSignedIn: isSignedIn(currentUser),
    isAdmin: isAdmin(currentUser),
    isBelongsToUser: isBelongsToUser(currentUser),
  }));

makeSession.key = '$session' as const;
