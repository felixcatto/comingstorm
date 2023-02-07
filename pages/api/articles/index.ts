import isEmpty from 'lodash/isEmpty';
import { ICurrentUser } from '../../../client/lib/types';
import { keygrip, objection } from '../../../lib/init';
import {
  checkSignedIn,
  getCurrentUser,
  isSignedIn,
  IValidate,
  switchHttpMethod,
  validate,
} from '../../../lib/utils';
import { articleSchema, IArticleSchema } from '../../../models';

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
