import { keygrip, objection } from '../../../lib/init';
import { encrypt } from '../../../lib/secure';
import {
  checkSignedIn,
  getCurrentUser,
  guestUser,
  makeErrors,
  removeCookie,
  setCookie,
  switchHttpMethod,
  validate,
} from '../../../lib/utils';
import { userLoginSchema } from '../../../models/User';
import { IValidate, IUserLoginSchema, ICurrentUser } from '../../../lib/types';

type ICtx = ICurrentUser;

export default switchHttpMethod({
  get: [
    getCurrentUser(objection, keygrip),
    checkSignedIn,
    async (req, res, ctx: ICtx) => {
      const { userIdSig } = req.cookies;
      res.json({ cookieName: 'userId', cookieValue: ctx.currentUser.id, signature: userIdSig });
    },
  ],
  post: [
    validate(userLoginSchema),
    async (req, res, ctx: IValidate<IUserLoginSchema>) => {
      const { User } = objection;
      const user = await User.query().findOne('email', ctx.body.email).withGraphFetched('avatar');
      if (!user) {
        return res.status(400).json(makeErrors({ email: 'User with such email not found' }));
      }

      if (user.password_digest !== encrypt(ctx.body.password)) {
        return res.status(400).json(makeErrors({ password: 'Wrong password' }));
      }

      setCookie(res, keygrip, 'userId', user.id);
      res.status(201).json(user);
    },
  ],
  delete: [
    getCurrentUser(objection, keygrip),
    (req, res, ctx: ICtx) => {
      removeCookie(res, 'userId');
      res.status(201).json({ currentUser: guestUser, signOutUserId: ctx.currentUser.id });
    },
  ],
});
