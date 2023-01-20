import path from 'path';
import { Model } from 'objection';
import * as y from 'yup';
import { roles, IRole } from '../lib/utils';
import encrypt from '../lib/secure';

export type IUser = {
  id: string;
  name: string;
  role: IRole;
  email: string;
  password_digest: string;
};

export type IUserLoginCreds = {
  email: string;
  password: string;
};

export class User extends Model {
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
    (this as any).password_digest = encrypt(value);
  }
}

export const guestUser = {
  id: '-1',
  name: 'Guest',
  role: roles.guest,
  email: '',
  password_digest: '',
};

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
