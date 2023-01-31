// shared utils for Server and Client
import { compile } from 'path-to-regexp';

type IMakeEnumResult<T extends ReadonlyArray<string>> = { [key in T[number]]: key };

function makeEnum<T extends ReadonlyArray<string>>(...args: T): IMakeEnumResult<T> {
  return args.reduce((acc, key) => ({ ...acc, [key]: key }), {} as IMakeEnumResult<T>);
}

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

export const guestUser = {
  id: '-1',
  name: 'Guest',
  role: roles.guest,
  email: '',
  password_digest: '',
};

export function makeUrlFor<T extends object>(rawRoutes: T) {
  const routes = Object.keys(rawRoutes).reduce(
    (acc, name) => ({ ...acc, [name]: compile(rawRoutes[name]) }),
    {} as any
  );

  return (name: keyof T, args = {}, opts = {}) => {
    const toPath = routes[name];
    return toPath(args, opts);
  };
}

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
  newTag: '/tags/new',
  editTag: '/tags/:id/edit',
  projectStructure: '/structure',
  session: '/session',
  newSession: '/session/new',
};
type IRouteName = keyof typeof routes;

export const getUrl = makeUrlFor(routes);
export const getApiUrl = (name: IRouteName, args?) => `/api/${getUrl(name, args)}`;

export type IGetApiUrl = typeof getApiUrl;
export type IRole = keyof typeof roles;
export type IAsyncState = keyof typeof asyncStates;
