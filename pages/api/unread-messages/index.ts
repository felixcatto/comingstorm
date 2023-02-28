import { keygrip, objection } from '../../../lib/init';
import { ICurrentUser, IUnreadMessageSchema, IValidateQuery } from '../../../lib/types';
import { checkSignedIn, getCurrentUser, switchHttpMethod, validate } from '../../../lib/utils';
import { unreadMessageSchema } from '../../../models';

type ICtx = ICurrentUser & IValidateQuery<IUnreadMessageSchema>;

export default switchHttpMethod({
  preHandler: getCurrentUser(objection, keygrip),
  delete: [
    checkSignedIn,
    validate(unreadMessageSchema, 'query'),
    async (req, res, ctx: ICtx) => {
      const { currentUser, query } = ctx;
      const { receiver_id, sender_id } = query;
      if (receiver_id !== currentUser.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const { UnreadMessage } = objection;
      const receiver = await UnreadMessage.query().delete().where({ receiver_id, sender_id });
      res.status(201).json({});
    },
  ],
});
