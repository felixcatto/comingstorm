import { useRouter } from 'next/router';
import Layout from '../../client/common/Layout.js';
import { useContext, WithApiErrors } from '../../client/lib/utils.js';
import Form from '../../client/users/form.js';
import { keygrip, objection } from '../../lib/init.js';
import { getUrl, getUserFromRequest, unwrap } from '../../lib/utils.js';

export async function getServerSideProps({ req, res }) {
  const { User } = objection;
  const currentUser = await getUserFromRequest(res, req.cookies, keygrip, User);
  return {
    props: unwrap({ currentUser }),
  };
}

const NewUser = WithApiErrors(props => {
  const { axios, getApiUrl } = useContext();
  const router = useRouter();
  const { setApiErrors } = props;

  const onSubmit = async values => {
    try {
      await axios.post(getApiUrl('users'), values);
      router.push(getUrl('users'));
    } catch (e) {
      setApiErrors(e.response.data.errors || {});
    }
  };

  return (
    <Layout>
      <h3>Create New User</h3>
      <Form onSubmit={onSubmit} />
    </Layout>
  );
});

export default NewUser;
