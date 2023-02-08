import { keygrip, objection } from '../../../lib/init';
import { ITagSchema, IValidate } from '../../../lib/types';
import { checkSignedIn, getCurrentUser, switchHttpMethod, validate } from '../../../lib/utils';
import { tagSchema } from '../../../models';

export default switchHttpMethod({
  preHandler: getCurrentUser(objection, keygrip),
  get: async (req, res) => {
    const { Tag } = objection;
    const tags = await Tag.query();
    res.status(200).json(tags);
  },
  post: [
    checkSignedIn,
    validate(tagSchema),
    async (req, res, ctx: IValidate<ITagSchema>) => {
      const { Tag } = objection;
      const tag = await Tag.query().insert(ctx.body);
      res.status(201).json(tag);
    },
  ],
});
