import { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Store } from 'effector';
import { NextApiRequest, NextApiResponse } from 'next';
import { ModelObject } from 'objection';
import wsWebSocket from 'ws';
import * as y from 'yup';
import { makeSession, makeSessionActions } from '../client/common/sessionSlice';
import { makeSignedInUsersIds, makeWs, makeWsClientActions } from '../client/common/wsSlice';
import {
  Article,
  articleSchema,
  Avatar,
  commentsSchema,
  Message,
  messageSchema,
  Tag,
  tagSchema,
  UnreadMessage,
  unreadMessageSchema,
  User,
  userLoginSchema,
  userSchema,
} from '../models';
import { objection } from './init';
import { asyncStates, getApiUrl, roles, socketStates, wsEvents, wsGeneralEvents } from './utils';

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
export type ISocketState = keyof typeof socketStates;

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
export type IValidateQuery<T> = {
  query: T;
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

export type IMessage = {
  id: number;
  text: string;
  created_at: string;
  updated_at: string;
  sender_id: number;
  receiver_id: number;
  sender?: IUser;
  receiver?: IUser;
};
export type IMessageClass = typeof Message;
export type IMessageSchema = y.InferType<typeof messageSchema>;

export type IUnreadMessage = {
  id: number;
  message_id: number;
  sender_id: number;
  receiver_id: number;
  sender?: IUser;
  receiver?: IUser;
  message?: IMessage;
};
export type IUnreadMessageClass = typeof UnreadMessage;
export type IUnreadMessageSchema = y.InferType<typeof unreadMessageSchema>;

export type IAvatar = {
  id: number;
  path: string;
  users?: IUser[];
};
export type IAvatarClass = typeof Avatar;

export type IUserWithAvatar = IUser & { avatar: IAvatar };
export type ISession = {
  currentUser: IUserWithAvatar;
  isAdmin: boolean;
  isSignedIn: boolean;
  isBelongsToUser: (resourceAuthorId: string) => boolean;
  status: IAsyncState;
  errors: any;
};
export type IWsStore = ReturnType<typeof makeWs>;
export type IWsClientActions = ReturnType<typeof makeWsClientActions>;
export type ISessionStore = ReturnType<typeof makeSession>;
export type ISessionActions = ReturnType<typeof makeSessionActions>;
export type ISignedInUsersIdsStore = ReturnType<typeof makeSignedInUsersIds>;
export type IActions = ISessionActions & IWsClientActions;

export type IContext = {
  getApiUrl: IGetApiUrl;
  axios: IAxiosInstance;
  actions: IActions;
  $ws: IWsStore;
  $session: ISessionStore;
  $signedInUsersIds: ISignedInUsersIdsStore;
  $isSignedInWss: Store<boolean>;
};

export type IApiErrors = {
  apiErrors: any;
  setApiErrors: any;
};

export type IWsEvents = typeof wsEvents;
export type IWsEvent = keyof IWsEvents;
export type IWsGeneralEvents = typeof wsGeneralEvents;
export type IWsGeneralEvent = keyof IWsGeneralEvents;
export type IEncode = (wsEvent: IWsEvent, message: string | object) => string;

export type IEchoMessage = { type: typeof wsEvents.echo; payload: any };
export type ISignOutMessage = { type: typeof wsEvents.signOut; payload: { id: any } };
export type ISignInMessage = {
  type: typeof wsEvents.signIn;
  payload: {
    cookieName: any;
    cookieValue: any;
    signature: any;
  };
};
export type IGetSignedInUsersIds = { type: typeof wsEvents.getSignedInUsersIds; payload: any[] };
export type INotifyNewMessage = {
  type: typeof wsEvents.notifyNewMessage;
  payload: { receiverId: number; senderId: number };
};
export type IDecodeReturn =
  | IEchoMessage
  | ISignInMessage
  | ISignOutMessage
  | IGetSignedInUsersIds
  | INotifyNewMessage;

type IWebSocketClient<T> = {
  socket: T;
  on: (wsEvent: IWsEvent | IWsGeneralEvent, handler: any) => void;
  emit: (wsEvent: IWsEvent, message?: string | object) => void;
  close: () => void;
};
export type INativeWSocketClient = IWebSocketClient<WebSocket>;
export type IWSClient = IWebSocketClient<InstanceType<typeof wsWebSocket>>;

export interface IAxiosInstance extends AxiosInstance {
  request<T = any, R = T, D = any>(config: AxiosRequestConfig<D>): Promise<R>;
  get<T = any, R = T, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
  delete<T = any, R = T, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
  head<T = any, R = T, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
  options<T = any, R = T, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
  post<T = any, R = T, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
  put<T = any, R = T, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
  patch<T = any, R = T, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
}

export type IPostSessionResponse = IUser;
export type IDeleteSessionResponse = {
  currentUser: IUser;
  signOutUserId: any;
};

export type ISelectItem =
  | string
  | {
      value: any;
      label: string;
      [key: string]: any;
    };
export type ISelectedItem = ISelectItem | null;
export type ISelectedItems = ISelectItem[];

export type IUsualSelect = (props: {
  name: string;
  data: ISelectItem[];
  defaultItem: ISelectItem;
}) => JSX.Element;

export type IPayloadTypes = 'query' | 'body';
export type IValidateFn = (schema, payloadType?: IPayloadTypes) => (req, res) => any;
