import { keygrip, objection } from '../../../lib/init';
import { encrypt } from '../../../lib/secure';
import { guestUser, removeCookie, setCookie, switchHttpMethod, validate } from '../../../lib/utils';
import { userLoginSchema } from '../../../models/User';
import { IValidate, IUserLoginSchema } from '../../../lib/types';

export default switchHttpMethod({
  post: [
    validate(userLoginSchema),
    async (req, res, ctx: IValidate<IUserLoginSchema>) => {
      const { User } = objection;
      const user = await User.query().findOne('email', ctx.body.email);
      if (!user) {
        return res.status(400).json({ errors: { email: 'User with such email not found' } });
      }

      if (user.password_digest !== encrypt(ctx.body.password)) {
        return res.status(400).json({ errors: { password: 'Wrong password' } });
      }

      setCookie(res, keygrip, 'userId', user.id);
      res.status(201).json(user);
    },
  ],
  delete: (req, res) => {
    removeCookie(res, 'userId');
    res.status(201).json(guestUser);
  },
});
