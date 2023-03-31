import { useRouter } from 'next/router';
import Layout from '../../client/common/Layout.js';
import { getApiUrl, isSignedIn, useContext, useSubmit, WithApiErrors } from '../../client/lib/utils.js';
import Form from '../../client/users/form.js';
import { keygrip, objection } from '../../lib/init.js';
import { getUrl, getUserFromRequest, unwrap } from '../../lib/utils.js';

export async function getServerSideProps({ req, res }) {
  const { User } = objection;
  const currentUser = await getUserFromRequest(res, req.cookies, keygrip, User);
  let unreadMessages: any = [];
  if (isSignedIn(currentUser)) {
    unreadMessages = await objection.UnreadMessage.query().where('receiver_id', currentUser.id);
  }
  return {
    props: unwrap({ currentUser, unreadMessages }),
  };
}

const NewUser = () => {
  const { axios } = useContext();
  const router = useRouter();

  const onSubmit = useSubmit(async values => {
    await axios.post(getApiUrl('users'), values);
    router.push(getUrl('users'));
  });

  return (
    <Layout>
      <h3>Create New User</h3>
      <Form onSubmit={onSubmit} />
    </Layout>
  );
};

export default WithApiErrors(NewUser);
