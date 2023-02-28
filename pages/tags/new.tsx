import { useRouter } from 'next/router';
import Layout from '../../client/common/Layout.js';
import { useContext, WithApiErrors } from '../../client/lib/utils.js';
import Form from '../../client/tags/form.js';
import { keygrip, objection } from '../../lib/init.js';
import { getUrl, getUserFromRequest, unwrap } from '../../lib/utils.js';

export async function getServerSideProps({ req, res }) {
  const { User } = objection;
  const currentUser = await getUserFromRequest(res, req.cookies, keygrip, User);
  return {
    props: unwrap({ currentUser }),
  };
}

const Tag = WithApiErrors(props => {
  const { axios, getApiUrl } = useContext();
  const router = useRouter();
  const { setApiErrors } = props;

  const onSubmit = async values => {
    try {
      await axios.post(getApiUrl('tags'), values);
      router.push(getUrl('tags'));
    } catch (e) {
      setApiErrors(e.response.data.errors || {});
    }
  };

  return (
    <Layout>
      <h3>Create New Tag</h3>
      <Form onSubmit={onSubmit} />
    </Layout>
  );
});

export default Tag;
