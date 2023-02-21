import { keygrip, objection } from '../../../lib/init';
import { ICurrentUser, IMessageSchema, IObjection, IValidate } from '../../../lib/types';
import {
  checkSignedIn,
  getCurrentUser,
  isBelongsToUser,
  switchHttpMethod,
  validate,
} from '../../../lib/utils';
import { messageSchema } from '../../../models';

type ICtx = IValidate<IMessageSchema> & ICurrentUser;

const getMessageAuthorId = async ({ Message }: IObjection, articleId) => {
  const message = await Message.query().findById(articleId);
  return message?.sender_id;
};

export default switchHttpMethod({
  preHandler: getCurrentUser(objection, keygrip),
  put: [
    checkSignedIn,
    async (req, res, ctx: ICtx) => {
      const messageAuthorId = await getMessageAuthorId(objection, req.query.id!);
      if (!isBelongsToUser(ctx.currentUser)(messageAuthorId)) {
        res.status(403).json({ message: 'Forbidden' });
      }
    },
    validate(messageSchema),
    async (req, res, ctx: IValidate<IMessageSchema>) => {
      const id = req.query.id!;
      const { Message } = objection;
      const message = await Message.query().updateAndFetchById(id, ctx.body);
      res.status(201).json(message);
    },
  ],
  delete: [
    checkSignedIn,
    async (req, res, ctx: ICtx) => {
      const messageAuthorId = await getMessageAuthorId(objection, req.query.id!);
      if (!isBelongsToUser(ctx.currentUser)(messageAuthorId)) {
        res.status(403).json({ message: 'Forbidden' });
      }
    },
    async (req, res, ctx: ICtx) => {
      const id = req.query.id!;
      await objection.Message.query().deleteById(id);
      res.status(201).json({ id });
    },
  ],
});
