import { Model, ModelObject } from 'objection';
import path from 'path';
import * as y from 'yup';
import { IArticle } from '../client/lib/types';

export class Tag extends Model {
  id: string;
  name: string;
  articles?: IArticle[];

  static get tableName() {
    return 'tags';
  }

  static get relationMappings() {
    return {
      articles: {
        relation: Model.ManyToManyRelation,
        modelClass: path.resolve(__dirname, 'Article.js'),
        join: {
          from: 'tags.id',
          through: {
            from: 'articles_tags.tag_id',
            to: 'articles_tags.article_id',
          },
          to: 'articles.id',
        },
      },
    };
  }
}

export const tagSchema = y.object({
  name: y.string().required('required'),
});

export type ITag = ModelObject<Tag>;
export type ITagClass = typeof Tag;
export type ITagSchema = y.InferType<typeof tagSchema>;
