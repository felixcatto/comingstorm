import { compile } from 'path-to-regexp';
import { IDecodeReturn, IEncode, IMakeEnum, IMakeUrlFor } from './types';
import avatars from './avatars';

export const makeEnum: IMakeEnum = (...args) =>
  args.reduce((acc, key) => ({ ...acc, [key]: key }), {} as any);

export const roles = makeEnum('user', 'admin', 'guest');
export const asyncStates = makeEnum('idle', 'pending', 'resolved', 'rejected');

export const isSignedIn = currentUser => currentUser.role !== roles.guest;
export const isAdmin = currentUser => currentUser.role === roles.admin;
export const isBelongsToUser = currentUser => resourceAuthorId =>
  currentUser.id === resourceAuthorId || currentUser.role === roles.admin;

export const makeSessionInfo: any = currentUser => ({
  currentUser,
  isSignedIn: isSignedIn(currentUser),
  isAdmin: isAdmin(currentUser),
  isBelongsToUser: isBelongsToUser(currentUser),
});

export const unwrap = value => JSON.parse(JSON.stringify(value));

const [guestAvatar] = avatars;
export const guestUser = {
  id: -111,
  name: 'Guest',
  role: roles.guest,
  email: '',
  password_digest: '',
  avatar_id: guestAvatar.id,
  avatar: guestAvatar,
} as const;

export const makeUrlFor: IMakeUrlFor = rawRoutes => {
  const routes = Object.keys(rawRoutes).reduce(
    (acc, name) => ({ ...acc, [name]: compile(rawRoutes[name]) }),
    {} as any
  );

  return (name, args = {}, opts = {}) => {
    const toPath = routes[name];
    return toPath(args, opts);
  };
};

export const routes = {
  home: '/',
  users: '/users',
  user: '/users/:id',
  newUser: '/users/new',
  editUser: '/users/:id/edit',
  articles: '/articles',
  article: '/articles/:id',
  newArticle: '/articles/new',
  editArticle: '/articles/:id/edit',
  tags: '/tags',
  tag: '/tags/:id',
  newTag: '/tags/new',
  editTag: '/tags/:id/edit',
  comments: '/articles/:id/comments',
  comment: '/articles/:id/comments/:commentId',
  projectStructure: '/structure',
  session: '/session',
  newSession: '/session/new',
  messages: '/messages',
  message: '/messages/:id',
};

export const getUrl = makeUrlFor(routes);
export const getApiUrl = (name: keyof typeof routes, args?) => `/api${getUrl(name, args)}`;

export const socketStates = makeEnum('unset', 'connecting', 'open', 'closed');
export const wsGeneralEvents = makeEnum('open', 'close');
export const wsEvents = makeEnum(
  'error',
  'echo',
  'signIn',
  'signOut',
  'signedInUsersIds',
  'getSignedInUsersIds'
);
export const encode: IEncode = (wsEvent, message) =>
  JSON.stringify({ type: wsEvent, payload: message });
export const decode = objBuffer => JSON.parse(objBuffer.toString()) as IDecodeReturn;
