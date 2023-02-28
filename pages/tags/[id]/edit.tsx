import { useRouter } from 'next/router';
import React from 'react';
import Layout from '../../../client/common/Layout.js';
import { useContext, WithApiErrors } from '../../../client/lib/utils.js';
import Form from '../../../client/tags/form.js';
import { keygrip, objection } from '../../../lib/init.js';
import { ITag } from '../../../lib/types.js';
import { getUrl, getUserFromRequest, unwrap } from '../../../lib/utils.js';

export async function getServerSideProps({ req, res }) {
  const { User } = objection;
  const currentUser = await getUserFromRequest(res, req.cookies, keygrip, User);
  return {
    props: unwrap({ currentUser }),
  };
}

const EditTag = WithApiErrors(props => {
  const { axios, getApiUrl } = useContext();
  const router = useRouter();
  const [tag, setTag] = React.useState<ITag | null>(null);
  const { id } = router.query;
  const { setApiErrors } = props;

  React.useEffect(() => {
    axios.get(getApiUrl('tag', { id })).then(data => setTag(data));
  }, []);

  const onSubmit = async values => {
    try {
      await axios.put(getApiUrl('tag', { id: tag!.id }), values);
      router.push(getUrl('tags'));
    } catch (e) {
      setApiErrors(e.response.data.errors || {});
    }
  };

  return (
    <Layout>
      <h3>Edit Tag</h3>
      {tag && <Form onSubmit={onSubmit} tag={tag} />}
    </Layout>
  );
});

export default EditTag;
