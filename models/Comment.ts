import { Model } from 'objection';
import * as y from 'yup';
import { Article, IArticle } from './Article';
import { IUser, User } from './User';

export class Comment extends Model {
  id: any;
  guest_name: any;
  text: any;
  created_at: any;
  updated_at: any;
  author_id: any;
  article_id: any;
  author?: IUser;
  article?: IArticle;

  static get tableName() {
    return 'comments';
  }

  static get relationMappings() {
    return {
      author: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'comments.author_id',
          to: 'users.id',
        },
      },

      article: {
        relation: Model.BelongsToOneRelation,
        modelClass: Article,
        join: {
          from: 'comments.article_id',
          to: 'articles.id',
        },
      },
    };
  }

  $beforeInsert() {
    this.created_at = new Date().toISOString();
    this.updated_at = new Date().toISOString();
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
  }

  static get modifiers() {
    return {
      orderByCreated(builder) {
        builder.orderBy('created_at');
      },
    };
  }
}

export const commentsSchema = y.object({
  guest_name: y.string().default(''),
  text: y.string().required('required'),
});

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
