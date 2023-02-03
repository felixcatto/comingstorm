import { useStore } from 'effector-react';
import Link from 'next/link';
import Layout from '../../client/common/Layout';
import { getUrl, unwrap, useContext, useRefreshPage } from '../../client/lib/utils';
import { keygrip, objection } from '../../lib/init';
import { getUserFromRequest } from '../../lib/utils';
import { IArticle } from '../../models';

type IArticlesProps = {
  articles: IArticle[];
};

export async function getServerSideProps({ req, res }) {
  const { Article, User } = objection;
  const currentUser = await getUserFromRequest(res, req.cookies, keygrip, User);
  const articles = await Article.query().withGraphFetched('[author, tags]').orderBy('id');

  return {
    props: unwrap({ currentUser, articles }),
  };
}

const Articles = ({ articles }: IArticlesProps) => {
  const { $session, getApiUrl, axios } = useContext();
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
        <Link href={getUrl('newArticle')} className="d-inline-block mb-30">
          <button className="btn btn-primary">Create new article</button>
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
                <div className="d-flex justify-content-end">
                  <Link href={getUrl('article', { id: article.id })} className="mr-10">
                    <button className="btn btn-sm btn-outline-primary">Show Article</button>
                  </Link>
                  {isBelongsToUser(article.author_id) && (
                    <>
                      <Link
                        href={getUrl('editArticle', { id: article.id })}
                        className="btn btn-sm btn-outline-primary mr-10"
                      >
                        Edit Article
                      </Link>
                      <div
                        className="btn btn-sm btn-outline-primary"
                        onClick={deleteArticle(article.id)}
                      >
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
