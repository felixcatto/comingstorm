import { keygrip, objection } from '../../../lib/init';
import {
  checkSignedIn,
  getCurrentUser,
  IValidate,
  switchHttpMethod,
  validate,
} from '../../../lib/utils';
import { ITagSchema, tagSchema } from '../../../models';

export default switchHttpMethod({
  preHandler: getCurrentUser(objection, keygrip),
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
