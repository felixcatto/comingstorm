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
  get: async (req, res) => {
    const { id } = req.query;
    if (!id) return res.status(400).json({});
    const tag = await objection.Tag.query().findById(id!);
    if (!tag) {
      return res.status(400).json({ message: `Entity with id '${id}' not found` });
    }
    return res.json(tag);
  },
  put: [
    checkSignedIn,
    validate(tagSchema),
    async (req, res, ctx: IValidate<ITagSchema>) => {
      const { id } = req.query;
      if (!id) return res.status(400).json({});

      const { Tag } = objection;
      const tag = await Tag.query().updateAndFetchById(id, ctx.body);
      res.status(201).json(tag);
    },
  ],
  delete: [
    checkSignedIn,
    async (req, res) => {
      const { id } = req.query;
      if (!id) return res.status(400).json({});

      await objection.Tag.query().delete().where('id', id);
      res.status(201).json({ id });
    },
  ],
});
