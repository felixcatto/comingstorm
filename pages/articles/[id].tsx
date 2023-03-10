import { useStore } from 'effector-react';
import { isEmpty } from 'lodash-es';
import { useRouter } from 'next/router';
import React from 'react';
import CommentForm from '../../client/comments/form.js';
import Layout from '../../client/common/Layout.js';
import {
  fmtISO,
  FormWrapper,
  roles,
  useContext,
  useImmerState,
  useRefreshPage,
  userRolesToIcons,
} from '../../client/lib/utils.js';
import { keygrip, objection } from '../../lib/init.js';
import { IArticle, IComment } from '../../lib/types.js';
import { getUserFromRequest, unwrap } from '../../lib/utils.js';
import s from './styles.module.css';

type IShowComment = {
  comment: IComment;
  articleId: any;
  isBelongsToUser: any;
  editComment: any;
  deleteComment: any;
};
const ShowComment = (props: IShowComment) => {
  const { comment, articleId, isBelongsToUser, editComment, deleteComment } = props;
  return (
    <div className="mb-4">
      <div className="flex items-center">
        {comment.author ? (
          <div className="flex items-center">
            <i className={userRolesToIcons[comment.author.role]}></i>
            <div className="steelblue ml-1">{comment.author.name}</div>
          </div>
        ) : (
          <div className="flex items-center">
            <i className={userRolesToIcons[roles.guest]}></i>
            <div className="steelblue ml-1">{comment.guest_name}</div>
          </div>
        )}
        {isBelongsToUser(comment.author_id) && (
          <div className="ml-7">
            <i
              className="fa fa-edit fa_big fa_link"
              title="edit"
              onClick={editComment(comment.id)}
            ></i>
            <i
              className="fa fa-trash-alt fa_big fa_link"
              title="delete"
              onClick={deleteComment({ articleId, commentId: comment.id })}
            ></i>
          </div>
        )}
      </div>
      <div className="text-justify">{comment.text}</div>
      <div className="text-xs text-slate-500">
        {fmtISO(comment.created_at, 'dd MMM yyyy HH:mm')}
      </div>
    </div>
  );
};

type IEditComment = {
  comment: IComment;
  cancelEditingComment: any;
  saveEditedComment: any;
};
const EditComment = (props: IEditComment) => {
  const { comment, cancelEditingComment, saveEditedComment } = props;
  const formRef: any = React.useRef(null);
  const saveComment = () => formRef.current.requestSubmit();

  return (
    <div className="mb-4">
      <div className="flex items-center">
        {comment.author ? (
          <div className="flex items-center">
            <i className={userRolesToIcons[comment.author.role]}></i>
            <div className="steelblue ml-1">{comment.author.name}</div>
          </div>
        ) : (
          <div className="flex items-center">
            <i className={userRolesToIcons[roles.guest]}></i>
            <div className="steelblue ml-1">{comment.guest_name}</div>
          </div>
        )}
        <div className="ml-7">
          <i
            className="fa fa-undo-alt fa_big fa_link"
            title="edit"
            onClick={cancelEditingComment}
          ></i>
          <i className="fa fa-save fa_big fa_link" title="save" onClick={saveComment}></i>
        </div>
      </div>
      <CommentForm type="edit" comment={comment} ref={formRef} onSubmit={saveEditedComment} />
      <div className="text-xs text-slate-500">
        {fmtISO(comment.created_at, 'dd MMM yyyy HH:mm')}
      </div>
    </div>
  );
};

type IArticleProps = {
  article: IArticle | null;
};

export async function getServerSideProps({ req, res, params }) {
  const { id } = params;
  const { User, Article } = objection;
  const currentUser = await getUserFromRequest(res, req.cookies, keygrip, User);
  const article = await Article.query()
    .findById(id)
    .withGraphFetched('[author, comments(orderByCreated).author, tags]');
  return {
    props: unwrap({ currentUser, article }),
  };
}

const ShowArticle = ({ article }: IArticleProps) => {
  const router = useRouter();
  const { id: articleId } = router.query;

  const { $session, axios, getApiUrl } = useContext();
  const { isBelongsToUser, isSignedIn } = useStore($session);
  const refreshPage = useRefreshPage();
  const [{ editedCommentId }, setState] = useImmerState({ editedCommentId: null });
  const [apiErrorsForNewCommentForm, setApiErrorsForNewCommentForm] = React.useState({});
  const [apiErrorsForEditCommentForm, setApiErrorsForEditCommentForm] = React.useState({});

  const deleteComment =
    ({ articleId: id, commentId }) =>
    async () => {
      await axios.delete(getApiUrl('comment', { id, commentId }));
      refreshPage();
    };
  const editComment = commentId => () => setState({ editedCommentId: commentId });
  const cancelEditingComment = () => setState({ editedCommentId: null });

  const saveNewComment = async (values, fmActions) => {
    try {
      await axios.post(getApiUrl('comments', { id: articleId }), values);
      fmActions.setFieldValue('text', '');
      refreshPage();
    } catch (e) {
      setApiErrorsForNewCommentForm(e.response.data.errors || {});
    }
  };

  const saveEditedComment = comment => async values => {
    try {
      await axios.put(getApiUrl('comment', { id: articleId, commentId: comment.id }), values);
      setState({ editedCommentId: null });
      refreshPage();
    } catch (e) {
      setApiErrorsForEditCommentForm(e.response.data.errors || {});
    }
  };

  if (!article) return <Layout />;

  return (
    <Layout>
      <div className="flex items-center mb-2">
        <h3 className="mr-5 mb-0">{article.title}</h3>
        {article.author && (
          <div className="flex items-center">
            <div className="steelblue mr-1">{article.author.name}</div>
            <i className={userRolesToIcons[article.author.role]}></i>
          </div>
        )}
      </div>

      <p className="text-justify mb-7">{article.text}</p>

      {!isEmpty(article.tags) && (
        <div className={s.articleTags}>
          <div className="text-xs text-slate-500 mr-2">Tags:</div>
          {article.tags?.map(tag => (
            <div key={tag.id} className={s.articleTag}>
              {tag.name}
            </div>
          ))}
        </div>
      )}

      {article.comments && (
        <div className="mb-7">
          <FormWrapper
            apiErrors={apiErrorsForEditCommentForm}
            setApiErrors={setApiErrorsForEditCommentForm}
          >
            {article.comments.map(comment =>
              comment.id === editedCommentId ? (
                <EditComment
                  key={comment.id}
                  comment={comment}
                  cancelEditingComment={cancelEditingComment}
                  saveEditedComment={saveEditedComment(comment)}
                />
              ) : (
                <ShowComment
                  key={comment.id}
                  comment={comment}
                  articleId={articleId}
                  isBelongsToUser={isBelongsToUser}
                  editComment={editComment}
                  deleteComment={deleteComment}
                />
              )
            )}
          </FormWrapper>
        </div>
      )}

      <div className="mb-2">Leave a comment</div>

      <FormWrapper
        apiErrors={apiErrorsForNewCommentForm}
        setApiErrors={setApiErrorsForNewCommentForm}
      >
        <CommentForm onSubmit={saveNewComment} />
      </FormWrapper>
    </Layout>
  );
};

export default ShowArticle;
