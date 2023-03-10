import { isNull } from 'lodash-es';
import { useRouter } from 'next/router';
import React from 'react';
import Form from '../../client/articles/form.js';
import Layout from '../../client/common/Layout.js';
import { useContext, WithApiErrors } from '../../client/lib/utils.js';
import { keygrip, objection } from '../../lib/init.js';
import { INullable, ITag } from '../../lib/types.js';
import { getUrl, getUserFromRequest, unwrap } from '../../lib/utils.js';

export async function getServerSideProps({ req, res }) {
  const { User } = objection;
  const currentUser = await getUserFromRequest(res, req.cookies, keygrip, User);
  return {
    props: unwrap({ currentUser }),
  };
}

const NewArticle = WithApiErrors(({ setApiErrors }) => {
  const { getApiUrl, axios } = useContext();
  const router = useRouter();
  const [tags, setTags] = React.useState<INullable<ITag[]>>(null);

  React.useEffect(() => {
    axios.get(getApiUrl('tags')).then(data => setTags(data));
  }, []);

  const onSubmit = async values => {
    try {
      await axios.post(getApiUrl('articles'), values);
      router.push(getUrl('articles'));
    } catch (e) {
      setApiErrors(e.response.data.errors || {});
    }
  };

  return (
    <Layout>
      <h3>Create New Article</h3>
      {!isNull(tags) && <Form tags={tags} onSubmit={onSubmit} />}
    </Layout>
  );
});

export default NewArticle;
