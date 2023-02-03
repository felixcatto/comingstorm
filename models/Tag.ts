import { Model } from 'objection';
import * as y from 'yup';
import { Article, IArticle } from './Article';

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
        modelClass: Article,
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

export type ITag = {
  id: any;
  name: any;
  articles?: IArticle[];
};
export type ITagClass = typeof Tag;
export type ITagSchema = y.InferType<typeof tagSchema>;
