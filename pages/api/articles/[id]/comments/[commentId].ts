import { ICurrentUser } from '../../../../../client/lib/types';
import { IObjection, keygrip, objection } from '../../../../../lib/init';
import {
  checkSignedIn,
  getCurrentUser,
  isAdmin,
  isBelongsToUser,
  IValidate,
  switchHttpMethod,
  validate,
} from '../../../../../lib/utils';
import { commentsSchema, ICommentSchema } from '../../../../../models';

type ICtx = IValidate<ICommentSchema> & ICurrentUser;

const getCommentAuthorId = async ({ Comment }: IObjection, commentId) => {
  const comment = await Comment.query().findById(commentId);
  return comment?.author_id;
};

export default switchHttpMethod({
  preHandler: getCurrentUser(objection, keygrip),
  get: async (req, res) => {
    const commentId = req.query.commentId!;
    const comment = await objection.Comment.query().findById(commentId);
    if (!comment) {
      return res.status(400).json({ message: `Entity with id '${commentId}' not found` });
    }
    res.json(comment);
  },
  put: [
    checkSignedIn,
    validate(commentsSchema),
    async (req, res, ctx: ICtx) => {
      const commentId = req.query.commentId!;
      const { Comment } = objection;

      const commentAuthorId = await getCommentAuthorId(objection, req.query.commentId!);
      if (commentAuthorId) {
        if (!isBelongsToUser(ctx.currentUser)(commentAuthorId)) {
          return res.status(403).json({ message: 'Forbidden' });
        }
      } else {
        // guest comment
        if (!isAdmin(ctx.currentUser)) {
          return res.status(403).json({ message: 'Forbidden' });
        }
        if (!ctx.body.guest_name) {
          return res
            .status(400)
            .json({ message: 'Input is not valid', errors: { guest_name: 'required' } });
        }
      }

      await Comment.query().update(ctx.body).where('id', commentId);
      res.status(201).json({ id: commentId });
    },
  ],
  delete: [
    checkSignedIn,
    async (req, res, ctx: ICtx) => {
      const commentAuthorId = await getCommentAuthorId(objection, req.query.commentId!);
      if (!isBelongsToUser(ctx.currentUser)(commentAuthorId)) {
        res.status(403).json({ message: 'Forbidden' });
      }
    },
    async (req, res) => {
      const commentId = req.query.commentId!;
      await objection.Comment.query().deleteById(commentId);
      res.status(201).json({ id: commentId });
    },
  ],
});
