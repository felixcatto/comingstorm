import { keygrip, objection } from '../../../lib/init';
import {
  checkSignedIn,
  getCurrentUser,
  IValidate,
  switchHttpMethod,
  validate,
} from '../../../lib/utils';
import { IArticleSchema, articleSchema } from '../../../models';
import { ICurrentUser } from '../../../client/lib/types';
import { isSignedIn } from '../../../lib/utils';
import isEmpty from 'lodash/isEmpty';

type ICtx = IValidate<IArticleSchema> & ICurrentUser;

export default switchHttpMethod({
  preHandler: getCurrentUser(objection, keygrip),
  post: [
    checkSignedIn,
    validate(articleSchema),
    async (req, res, ctx: ICtx) => {
      const { Article } = objection;
      const { currentUser } = ctx;
      const { tagIds, ...articleData } = ctx.body;

      const article = await Article.query().insert(articleData);
      if (isSignedIn(currentUser)) {
        await article.$relatedQuery<any>('author').relate(currentUser.id);
      }

      if (!isEmpty(tagIds)) {
        await Promise.all(tagIds.map(tagId => article.$relatedQuery<any>('tags').relate(tagId)));
      }

      res.status(201).json(article);
    },
  ],
});

// export const getArticles = async Article => Article.query().withGraphFetched('[author, tags]');

// export default async app => {
//   app.get('/articles', { name: 'articles' }, async () => getArticles(Article));

//   app.register(comments, { prefix: '/articles/:id' });
// };
