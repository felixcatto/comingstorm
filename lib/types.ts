import { NextApiRequest, NextApiResponse } from 'next';
import { ModelObject } from 'objection';
import * as y from 'yup';
import { makeSession, makeSessionActions } from '../client/common/sessionSlice';
import {
  Article,
  articleSchema,
  commentsSchema,
  Tag,
  tagSchema,
  User,
  userLoginSchema,
  userSchema,
} from '../models';
import { objection } from './init';
import { asyncStates, getApiUrl, roles } from './utils';

export type IObjection = typeof objection;

export type IMakeEnum = <T extends ReadonlyArray<string>>(
  ...args: T
) => { [key in T[number]]: key };

export type IMakeUrlFor = <T extends object>(
  rawRoutes: T
) => (name: keyof T, args?, opts?) => string;

export type IGetApiUrl = typeof getApiUrl;

export type IRole = keyof typeof roles;
export type IAsyncState = keyof typeof asyncStates;

export type IHandler = (req: NextApiRequest, res: NextApiResponse, ctx: any) => object | void;
export type IMixHandler = IHandler | IHandler[];
export type IHttpMethods = {
  preHandler?: IMixHandler;
  get?: IMixHandler;
  post?: IMixHandler;
  put?: IMixHandler;
  delete?: IMixHandler;
};
export type ISwitchHttpMethod = (
  methods: IHttpMethods
) => (req: NextApiRequest, res: NextApiResponse) => Promise<any>;

export type IValidate<T> = {
  body: T;
};
export type INullable<T> = T | null;

export interface IEmptyObject {
  [key: string]: undefined;
}

export type IUser = Omit<ModelObject<User>, 'password'>;
export type IUserClass = typeof User;
export type IUserSchema = y.InferType<typeof userSchema>;
export type IUserLoginSchema = y.InferType<typeof userLoginSchema>;

export type ICurrentUser = {
  currentUser: IUser;
};
export type IUserLoginCreds = {
  email: string;
  password: string;
};

export type IArticle = {
  id: any;
  title: any;
  text: any;
  created_at: any;
  updated_at: any;
  tagIds: any[];
  author_id: any;
  author?: IUser;
  comments?: IComment[];
  tags?: ITag[];
};
export type IArticleClass = typeof Article;
export type IArticleSchema = y.InferType<typeof articleSchema>;

export type IComment = {
  id: any;
  guest_name: any;
  text: any;
  created_at: any;
  updated_at: any;
  author_id: any;
  article_id: any;
  author?: IUser;
  article?: IArticle;
};
export type ICommentClass = typeof Comment;
export type ICommentSchema = y.InferType<typeof commentsSchema>;

export type ITag = {
  id: any;
  name: any;
  articles?: IArticle[];
};
export type ITagClass = typeof Tag;
export type ITagSchema = y.InferType<typeof tagSchema>;

export type ISession = {
  currentUser: IUser;
  isAdmin: boolean;
  isSignedIn: boolean;
  isBelongsToUser: (resourceAuthorId: string) => boolean;
  status: IAsyncState;
  errors: any;
};
export type ISessionActions = ReturnType<typeof makeSessionActions>;
export type ISessionStore = ReturnType<typeof makeSession>;

export type IContext = {
  getApiUrl: IGetApiUrl;
  axios: any;
  actions: ISessionActions;
  $session: ISessionStore;
};

export type IApiErrors = {
  apiErrors: any;
  setApiErrors: any;
};
