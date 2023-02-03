import { IArticle, IUser } from '../../models';

export interface IEmptyObject {
  [key: string]: undefined;
}

export interface IComment {
  id: any;
  guest_name: any;
  text: any;
  created_at: any;
  updated_at: any;
  author_id: any;
  article_id: any;
  author?: IUser;
  article?: IArticle;
}

export type ICurrentUser = {
  currentUser: IUser;
};
