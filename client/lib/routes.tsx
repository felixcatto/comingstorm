import css from 'styled-jsx/css';
import { makeUrlFor } from './utils';

export const routes = {
  home: '/',
  users: '/users',
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
