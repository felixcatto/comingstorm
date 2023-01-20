import path from 'path';
import { Model } from 'objection';
import * as y from 'yup';

export class Tag extends Model {
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

  static get yupSchema() {
    return y.object({
      name: y.string().required('required'),
    });
  }
}
