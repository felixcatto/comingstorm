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
  post: [
    checkAdmin,
    validate(userSchema),
    async (req, res, ctx: IValidate<IUserSchema>) => {
      const { User } = objection;
      const { isUnique, errors } = await checkValueUnique(User, 'email', ctx.body.email);
      if (!isUnique) {
        return res.status(400).json({ errors });
      }

      const user = await User.query().insert(ctx.body);
      res.status(201).json(user);
    },
  ],
});