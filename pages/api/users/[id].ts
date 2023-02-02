import { keygrip, objection } from '../../../lib/init';
import {
  checkAdmin,
  checkValueUnique,
  getCurrentUser,
  IValidate,
  switchHttpMethod,
  validate,
} from '../../../lib/utils';
import { IUserSchema, userSchema } from '../../../models';

export default switchHttpMethod({
  preHandler: getCurrentUser(objection, keygrip),
  get: async (req, res) => {
    const { id } = req.query;
    if (!id) return res.status(400).json({});
    const user = await objection.User.query().findById(id);
    if (!user) {
      return res.status(400).json({ message: `Entity with id '${id}' not found` });
    }
    return res.json(user);
  },
  put: [
    checkAdmin,
    validate(userSchema),
    async (req, res, ctx: IValidate<IUserSchema>) => {
      const id = req.query.id as string;
      const { User } = objection;

      const { isUnique, errors } = await checkValueUnique(User, 'email', ctx.body.email, id);
      if (!isUnique) {
        return res.status(400).json({ errors });
      }

      const user = await User.query().updateAndFetchById(id, ctx.body);
      res.status(201).json(user);
    },
  ],
  delete: [
    checkAdmin,
    async (req, res) => {
      const { id } = req.query;
      if (!id) return res.status(400).json({});

      await objection.User.query().delete().where('id', id);
      res.status(201).json({ id });
    },
  ],
});
