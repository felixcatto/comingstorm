import { keygrip, objection } from '../../../lib/init';
import { ICurrentUser, IMessageSchema, IValidate } from '../../../lib/types';
import {
  checkSignedIn,
  getCurrentUser,
  makeErrors,
  switchHttpMethod,
  validate,
} from '../../../lib/utils';
import { messageSchema } from '../../../models';

type ICtx = ICurrentUser & IValidate<IMessageSchema>;

export default switchHttpMethod({
  preHandler: getCurrentUser(objection, keygrip),
  get: async (req, res) => {
    const { Message } = objection;
    const messages = await Message.query();
    res.status(200).json(messages);
  },
  post: [
    checkSignedIn,
    validate(messageSchema),
    async (req, res, ctx: ICtx) => {
      const sender_id = ctx.currentUser.id;
      const { Message } = objection;
      const receiver = await Message.query().findById(ctx.body.receiver_id);
      if (!receiver) {
        return res.status(400).json(makeErrors({ receiver_id: 'user does not exist' }));
      }
      const message = await Message.query().insert({ ...ctx.body, sender_id });
      const fullMessage = await Message.query()
        .withGraphFetched('[receiver.avatar, sender.avatar]')
        .findById(message.id)
        .orderBy('created_at', 'desc');
      res.status(201).json(fullMessage);
    },
  ],
});