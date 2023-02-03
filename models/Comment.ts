export {};
// import path from 'path';
// import { Model } from 'objection';
// import * as y from 'yup';
// import { requiredIfExists } from '../lib/utils';

// export class Comment extends Model {
//   static get tableName() {
//     return 'comments';
//   }

//   static get relationMappings() {
//     return {
//       author: {
//         relation: Model.BelongsToOneRelation,
//         modelClass: path.resolve(__dirname, 'User.js'),
//         join: {
//           from: 'comments.author_id',
//           to: 'users.id',
//         },
//       },

//       article: {
//         relation: Model.BelongsToOneRelation,
//         modelClass: path.resolve(__dirname, 'Article.js'),
//         join: {
//           from: 'comments.article_id',
//           to: 'articles.id',
//         },
//       },
//     };
//   }

//   $beforeInsert() {
//     this.created_at = new Date().toISOString();
//   }

//   $beforeUpdate() {
//     this.updated_at = new Date().toISOString();
//   }

//   static get yupSchema() {
//     return y.object({
//       guest_name: y.string().test(...requiredIfExists()),
//       text: y.string().required('required'),
//     });
//   }

//   static get modifiers() {
//     return {
//       orderByCreated(builder) {
//         builder.orderBy('created_at');
//       },
//     };
//   }
// }
