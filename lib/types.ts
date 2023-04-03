import { AxiosInstance, AxiosRequestConfig } from 'axios';
import { FormikHelpers } from 'formik';
import { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from 'next';
import wsWebSocket from 'ws';
import { Interpreter } from 'xstate';
import * as y from 'yup';
import {
  makeActions,
  makeCurrentUser,
  makeSession,
  makeSignedInUsersIds,
} from '../client/lib/effectorStore.js';
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
} from '../models/index.js';
import { orm } from './init.js';
import { asyncStates, getApiUrl, roles, socketStates, wsEvents, wsGeneralEvents } from './utils.js';

export type IOrm = typeof orm;

export type IKeygrip = {
  sign: (data) => string;
  index: (data, digest) => number;
  verify: (data, digest) => boolean;
};

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

export interface IEmptyObject {
  [key: string]: undefined;
}

export type IUser = {
  id: number;
  name: string;
  role: IRole;
  email: string;
  password_digest: string;
  isDeleted: boolean;
  avatar_id: number;
  articles?: IArticle[];
  comments?: IComment[];
  avatar?: IAvatar;
};
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

export type IWSActor = Interpreter<any, any, any>;

export type IActions = ReturnType<typeof makeActions>;
export type ICurrentUserStore = ReturnType<typeof makeCurrentUser>;
export type ISignedInUsersIdsStore = ReturnType<typeof makeSignedInUsersIds>;
export type ISession = ReturnType<typeof makeSession>;

export type IContext = {
  axios: IAxiosInstance;
  actions: IActions;
  wsActor: IWSActor;
  [makeCurrentUser.key]: ICurrentUserStore;
  [makeSignedInUsersIds.key]: ISignedInUsersIdsStore;
  [makeSession.key]: ISession;
  unreadMessages: IUnreadMessage[];
};

export type IApiErrors = {
  apiErrors: any;
  setApiErrors: any;
};

export type IWsEvents = typeof wsEvents;
export type IWsEvent = keyof IWsEvents;
export type IWsGeneralEvents = typeof wsGeneralEvents;
export type IWsGeneralEvent = keyof IWsGeneralEvents;
export type IEncode = (wsEvent: IWsEvent, payload?: string | object) => string;
export type ISend = (wsActor: IWSActor, wsEvent: IWsEvent, payload?: string | object) => void;

export type IEchoMessage = { type: typeof wsEvents.echo; payload: any };
export type ISignOutMessage = { type: typeof wsEvents.signOut; payload: { id: any } };
export type ISignInMessage = {
  type: typeof wsEvents.signIn;
  payload: IGetSessionResponse;
};
export type IGetSignedInUsersIds = { type: typeof wsEvents.getSignedInUsersIds; payload: any[] };
export type INotifyNewMessage = {
  type: typeof wsEvents.notifyNewMessage;
  payload: { receiverId: number; senderId: number };
};
export type ISignedInUsersIds = {
  type: typeof wsEvents.signedInUsersIds;
  payload: number[];
};
export type INewMessagesArrived = {
  type: typeof wsEvents.newMessagesArrived;
  payload: { senderId: number };
};
export type IWSDecodeReturn = ISignedInUsersIds | INewMessagesArrived;
export type IWSSDecodeReturn =
  | IEchoMessage
  | ISignInMessage
  | ISignOutMessage
  | IGetSignedInUsersIds
  | INotifyNewMessage;

export type INativeWebSocket = WebSocket;
export type IWSClient = InstanceType<typeof wsWebSocket>;

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

export type IPostSessionResponse = IUserWithAvatar;
export type IGetSessionResponse = {
  userId: number;
  signature: string;
};
export type IDeleteSessionResponse = {
  currentUser: IUserWithAvatar;
  signOutUserId: any;
};

export type IOnSubmit = (values, actions: FormikHelpers<any>) => Promise<any>;
export type IUseSubmit = (onSubmit: IOnSubmit) => IOnSubmit;

export type ISelectOption = {
  value: any;
  label: string;
  [key: string]: any;
};
export type ISelectedOption = ISelectOption | null;

export type IUsualSelect = (props: {
  name: string;
  options: ISelectOption[];
  defaultItem?: ISelectedOption;
}) => JSX.Element;

export type IFMultiSelectProps = {
  name: string;
  options: ISelectOption[];
  defaultOptions?: ISelectOption[];
};

export type IPayloadTypes = 'query' | 'body';
export type IValidateFn = (schema, payloadType?: IPayloadTypes) => (req, res) => any;

export type IPageProps = {
  currentUser: IUserWithAvatar;
  unreadMessages: IUnreadMessage[];
};

export type IUnreadMessagesDict = {
  [senderId: string]: {
    msgCount: number;
  };
};

type IFn<T> = (freshState: T) => Partial<T>;
type ISetState<T> = (fnOrObject: Partial<T> | IFn<T>) => void;
export type IUseMergeState = <T>(initialState: T) => [state: T, setState: ISetState<T>];

export type IAuthenticate = (
  rawCookies,
  keygrip,
  fetchUser: (id) => Promise<IUser | undefined>
) => Promise<[currentUser: IUser, shouldRemoveSession: boolean]>;

type IGenericProps = {
  currentUser: IUserWithAvatar;
  unreadMessages: IUnreadMessage[];
};

export type IGetGenericProps = <T extends object>(
  props: {
    ctx: GetServerSidePropsContext;
    keygrip: IKeygrip;
    orm: IOrm;
  },
  otherProps?: T
) => Promise<T & IGenericProps>;

export type IGetUserId = (
  rawCookies,
  keygrip: IKeygrip
) => { userId: null; isSignatureCorrect: false } | { userId: string; isSignatureCorrect: boolean };
