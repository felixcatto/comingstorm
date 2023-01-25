// shared utils for Server and Client
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

export type IRole = keyof typeof roles;
export type IAsyncState = keyof typeof asyncStates;
