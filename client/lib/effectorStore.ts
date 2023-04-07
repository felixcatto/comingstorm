import { createEffect, createEvent, createStore, sample } from 'effector';
import produce from 'immer';
import { isNull } from 'lodash-es';
import { delay } from 'patronum';
import {
  IActions,
  IAsyncState,
  ICurrentUserStore,
  IDeleteSessionResponse,
  IMakeNotificationAnimationDuration,
  INotification,
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
  addNotification: createEvent<INotification>(),
  removeNotification: createEvent<string>(),
  setNotificationAnimationDuration: createEvent<number>(),
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

export const makeNotificationAnimationDuration = (actions: IActions, initialState = 0) =>
  createStore(initialState).on(
    actions.setNotificationAnimationDuration,
    (state, animationDuration) => animationDuration
  );

makeNotificationAnimationDuration.key = '$notificationAnimationDuration' as const;

export const makeNotifications = (
  actions: IActions,
  $notificationAnimationDuration: IMakeNotificationAnimationDuration,
  initialState: INotification[] = []
) => {
  const $notifications = createStore(initialState);

  // AddFlow
  sample({
    source: $notifications,
    clock: actions.addNotification,
    fn: (state, newNotification) => [newNotification].concat(state),
    target: $notifications,
  });

  sample({
    source: $notifications,
    clock: delay({ source: actions.addNotification, timeout: 50 }),
    fn: (state, newNotification) =>
      produce(state, draft => {
        const item = draft.find(el => el.id === newNotification.id);
        if (!item) return;
        item.isHidden = false;
      }),
    target: $notifications,
  });

  sample({
    source: $notifications,
    clock: delay({
      source: actions.addNotification,
      timeout: ({ autoremoveTimeout }) => autoremoveTimeout ?? 0,
    }),
    fn: (state, newNotification) => newNotification.id,
    filter: (_, { autoremoveTimeout }) => !isNull(autoremoveTimeout),
    target: actions.removeNotification,
  });

  // RemoveFlow
  sample({
    source: $notifications,
    clock: actions.removeNotification,
    fn: (state, id) =>
      produce(state, draft => {
        const item = draft.find(el => el.id === id);
        if (!item) return;
        item.isHidden = true;
        item.isInverseAnimation = true;
      }),
    target: $notifications,
  });

  sample({
    source: $notifications,
    clock: delay({
      source: actions.removeNotification,
      timeout: $notificationAnimationDuration,
    }),
    fn: (state, id) => state.filter(el => el.id !== id),
    target: $notifications,
  });

  return $notifications;
};

makeNotifications.key = '$notifications' as const;

export const makeSession = ($currentUser: ICurrentUserStore) =>
  $currentUser.map(({ data: currentUser }) => ({
    currentUser,
    isSignedIn: isSignedIn(currentUser),
    isAdmin: isAdmin(currentUser),
    isBelongsToUser: isBelongsToUser(currentUser),
  }));

makeSession.key = '$session' as const;
