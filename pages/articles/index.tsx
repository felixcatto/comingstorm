import { useStore } from 'effector-react';
import Link from 'next/link';
import Layout from '../../client/common/Layout.js';
import {
  getApiUrl,
  getUrl,
  isSignedIn,
  unwrap,
  useContext,
  useRefreshPage,
} from '../../client/lib/utils.js';
import { keygrip, objection } from '../../lib/init.js';
import { IArticle } from '../../lib/types.js';
import { getUserFromRequest } from '../../lib/utils.js';

type IArticlesProps = {
  articles: IArticle[];
};

export async function getServerSideProps({ req, res }) {
  const { Article, User } = objection;
  const currentUser = await getUserFromRequest(res, req.cookies, keygrip, User);
  let unreadMessages: any = [];
  if (isSignedIn(currentUser)) {
    unreadMessages = await objection.UnreadMessage.query().where('receiver_id', currentUser.id);
  }
  const articles = await Article.query().withGraphFetched('[author, tags]').orderBy('id');
  return {
    props: unwrap({ currentUser, unreadMessages, articles }),
  };
}

const Articles = ({ articles }: IArticlesProps) => {
  const { $session, axios } = useContext();
  const { isSignedIn, isBelongsToUser } = useStore($session);
  const refreshPage = useRefreshPage();

  const deleteArticle = id => async () => {
    await axios.delete(getApiUrl('article', { id }));
    refreshPage();
  };

  return (
    <Layout>
      <h3>Articles List</h3>

      {isSignedIn && (
        <Link href={getUrl('newArticle')} className="btn mb-6">
          Create new article
        </Link>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Text</th>
            <th>Author</th>
            <th>Tags</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {articles?.map(article => (
            <tr key={article.id}>
              <td>{article.title}</td>
              <td className="text-justify">{article.text}</td>
              <td>{article.author?.name}</td>
              <td>{article.tags?.map(tag => tag.name).join(', ')}</td>
              <td>
                <div className="flex justify-end">
                  <Link
                    href={getUrl('article', { id: article.id })}
                    className="btn-outline btn_sm  mr-2"
                  >
                    Show Article
                  </Link>
                  {isBelongsToUser(article.author_id) && (
                    <>
                      <Link
                        href={getUrl('editArticle', { id: article.id })}
                        className="btn-outline btn_sm mr-2"
                      >
                        Edit Article
                      </Link>
                      <div className="btn-outline btn_sm" onClick={deleteArticle(article.id)}>
                        Remove Article
                      </div>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
};

export default Articles;
