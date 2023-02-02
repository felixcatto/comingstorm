import path from 'path';
import { Model, ModelObject } from 'objection';
import * as y from 'yup';
import { roles, IRole } from '../lib/utils';
import { encrypt } from '../lib/secure';
import { IArticle, IComment } from '../client/lib/types';

export type IUserLoginCreds = {
  email: string;
  password: string;
};

export class User extends Model {
  id: string;
  name: string;
  role: IRole;
  email: string;
  password_digest: string;
  articles?: IArticle[];
  comments?: IComment[];

  static get tableName() {
    return 'users';
  }

  static get relationMappings() {
    return {
      articles: {
        relation: Model.HasManyRelation,
        modelClass: path.resolve(__dirname, 'Article.js'),
        join: {
          from: 'users.id',
          to: 'articles.author_id',
        },
      },

      comments: {
        relation: Model.HasManyRelation,
        modelClass: path.resolve(__dirname, 'Comment.js'),
        join: {
          from: 'users.id',
          to: 'comments.author_id',
        },
      },
    };
  }

  set password(value) {
    this.password_digest = encrypt(value);
  }
}

export const userSchema = y.object({
  name: y.string().required('required'),
  role: y.mixed().oneOf(Object.values(roles)).required('required'),
  email: y.string().email().required('required'),
  password: y.string().required('required'),
});

export const userLoginSchema = y.object({
  email: y.string().email().required('required'),
  password: y.string().required('required'),
});

export type IUser = Omit<ModelObject<User>, 'password'>;
export type IUserClass = typeof User;
export type IUserSchema = y.InferType<typeof userSchema>;
export type IUserLoginSchema = y.InferType<typeof userLoginSchema>;
