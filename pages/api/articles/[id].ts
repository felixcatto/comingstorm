import { difference } from 'lodash-es';
import { keygrip, objection } from '../../../lib/init.js';
import { IArticleSchema, ICurrentUser, IObjection, IValidate } from '../../../lib/types.js';
import {
  checkSignedIn,
  getCurrentUser,
  isBelongsToUser,
  switchHttpMethod,
  validate,
} from '../../../lib/utils.js';
import { articleSchema } from '../../../models/index.js';

type ICtx = IValidate<IArticleSchema> & ICurrentUser;

const getArticleAuthorId = async ({ Article }: IObjection, articleId) => {
  const article = await Article.query().findById(articleId);
  return article?.author_id;
};

export default switchHttpMethod({
  preHandler: getCurrentUser(objection, keygrip),
  get: async (req, res) => {
    const id = req.query.id!;
    const { Article } = objection;
    const article = await Article.query().findById(id).withGraphFetched('[author, tags]');
    if (!article) {
      return res.status(400).json({ message: `Entity with id '${id}' not found` });
    }
    return res.json(article);
  },
  put: [
    checkSignedIn,
    async (req, res, ctx: ICtx) => {
      const articleAuthorId = await getArticleAuthorId(objection, req.query.id!);
      if (!isBelongsToUser(ctx.currentUser)(articleAuthorId)) {
        res.status(403).json({ message: 'Forbidden' });
      }
    },
    validate(articleSchema),
    async (req, res, ctx: ICtx) => {
      const id = req.query.id!;
      const { Article } = objection;
      const { tagIds, ...articleData } = ctx.body;
      const article = await Article.query()
        .updateAndFetchById(id, articleData)
        .withGraphFetched('tags');
      const tagIdsToDelete = difference(article.tagIds, tagIds);
      const tagIdsToInsert = difference(tagIds, article.tagIds);

      await article.$relatedQuery<any>('tags').unrelate().where('id', 'in', tagIdsToDelete);
      await Promise.all(
        tagIdsToInsert.map(tagId => article.$relatedQuery<any>('tags').relate(tagId))
      );

      res.status(201).json(article);
    },
  ],
  delete: [
    checkSignedIn,
    async (req, res, ctx: ICtx) => {
      const articleAuthorId = await getArticleAuthorId(objection, req.query.id!);
      if (!isBelongsToUser(ctx.currentUser)(articleAuthorId)) {
        res.status(403).json({ message: 'Forbidden' });
      }
    },
    async (req, res, ctx: ICtx) => {
      const id = req.query.id!;
      const { Article } = objection;
      await Article.query().deleteById(id);
      res.status(201).json({ id });
    },
  ],
});
