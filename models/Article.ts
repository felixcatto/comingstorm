import path from 'path';
import { Model } from 'objection';
import * as y from 'yup';

export class Article extends Model {
  static get tableName() {
    return 'articles';
  }

  static get relationMappings() {
    return {
      author: {
        relation: Model.BelongsToOneRelation,
        modelClass: path.resolve(__dirname, 'User.js'),
        join: {
          from: 'articles.author_id',
          to: 'users.id',
        },
      },

      comments: {
        relation: Model.HasManyRelation,
        modelClass: path.resolve(__dirname, 'Comment.js'),
        join: {
          from: 'articles.id',
          to: 'comments.article_id',
        },
      },

      tags: {
        relation: Model.ManyToManyRelation,
        modelClass: path.resolve(__dirname, 'Tag.js'),
        join: {
          from: 'articles.id',
          through: {
            from: 'articles_tags.article_id',
            to: 'articles_tags.tag_id',
          },
          to: 'tags.id',
        },
      },
    };
  }

  get tagIds() {
    return this.tags ? this.tags.map(tag => tag.id).sort() : [];
  }

  $beforeInsert() {
    this.created_at = new Date().toISOString();
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
  }

  static get yupSchema() {
    return y.object({
      title: y.string().required('required'),
      text: y.string(),
      tagIds: y.array().default([]),
    });
  }
}
