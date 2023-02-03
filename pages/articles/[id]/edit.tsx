import { useStore } from 'effector-react';
import isEmpty from 'lodash/isEmpty';
import { useRouter } from 'next/router';
import React from 'react';
import Form from '../../../client/articles/form';
import Layout from '../../../client/common/Layout';
import { useContext, useImmerState, WithApiErrors } from '../../../client/lib/utils';
import { keygrip, objection } from '../../../lib/init';
import { getUrl, getUserFromRequest, INullable, unwrap } from '../../../lib/utils';
import { IArticle, ITag } from '../../../models';

type IState = {
  article: INullable<IArticle>;
  tags: ITag[];
};

export async function getServerSideProps({ req, res }) {
  const { User } = objection;
  const currentUser = await getUserFromRequest(res, req.cookies, keygrip, User);
  return {
    props: unwrap({ currentUser }),
  };
}

const EditArticle = WithApiErrors(({ setApiErrors }) => {
  const router = useRouter();
  const { getApiUrl, axios, $session } = useContext();
  const { id } = router.query;
  const { isBelongsToUser } = useStore($session);
  const [{ article, tags }, setState] = useImmerState<IState>({ article: null, tags: [] });

  React.useEffect(() => {
    Promise.all([axios.get(getApiUrl('article', { id })), axios.get(getApiUrl('tags'))]).then(
      ([articleData, tagsData]) => setState({ article: articleData, tags: tagsData })
    );
  }, []);

  const onSubmit = async values => {
    try {
      await axios.put(getApiUrl('article', { id: article!.id }), values);
      router.push(getUrl('articles'));
    } catch (e) {
      setApiErrors(e.response.data.errors || {});
    }
  };

  if (isEmpty(article)) return <Layout />;
  if (!isBelongsToUser(article.author_id)) return <Layout>403 forbidden</Layout>;

  return (
    <Layout>
      <h3>Edit Article</h3>
      <Form article={article} tags={tags} onSubmit={onSubmit} />
    </Layout>
  );
});

export default EditArticle;
