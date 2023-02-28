import { differenceBy, isEmpty } from 'lodash-es';
import avatars from '../../../lib/avatars.js';
import { keygrip, objection } from '../../../lib/init.js';
import { IUserSchema, IValidate } from '../../../lib/types.js';
import {
  checkAdmin,
  checkValueUnique,
  getCurrentUser,
  getRandomNumUpTo,
  switchHttpMethod,
  validate,
} from '../../../lib/utils.js';
import { userSchema } from '../../../models/index.js';

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

      const [guestAvatar, ...userAvatars] = avatars;
      const existedUserAvatars = await objection.knex
        .select('a.id')
        .from('avatars as a')
        .join('users as u', 'u.avatar_id', '=', 'a.id')
        .groupBy('a.id');
      let newUserAvatar;
      const availabeFreeAvatars = differenceBy(userAvatars, existedUserAvatars, 'id');
      if (!isEmpty(availabeFreeAvatars)) {
        newUserAvatar = availabeFreeAvatars[getRandomNumUpTo(availabeFreeAvatars.length)];
      } else {
        newUserAvatar = userAvatars[getRandomNumUpTo(userAvatars.length)];
      }

      const user = await User.query().insert({ ...ctx.body, avatar_id: newUserAvatar.id });
      res.status(201).json(user);
    },
  ],
});
