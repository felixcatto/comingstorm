import { useRouter } from 'next/router';
import React from 'react';
import Layout from '../../../client/common/Layout.js';
import { isSignedIn, useContext, WithApiErrors } from '../../../client/lib/utils.js';
import Form from '../../../client/users/form.js';
import { keygrip, objection } from '../../../lib/init.js';
import { getUrl, getUserFromRequest, unwrap } from '../../../lib/utils.js';
import { IUser } from '../../../lib/types.js';

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

const EditUser = WithApiErrors(props => {
  const { axios, getApiUrl } = useContext();
  const router = useRouter();
  const [user, setUser] = React.useState<IUser | null>(null);
  const { id } = router.query;
  const { setApiErrors } = props;

  React.useEffect(() => {
    axios.get(getApiUrl('user', { id })).then(data => setUser(data));
  }, []);

  const onSubmit = async values => {
    try {
      await axios.put(getApiUrl('user', { id: user!.id }), values);
      router.push(getUrl('users'));
    } catch (e: any) {
      setApiErrors(e.response.data.errors || {});
    }
  };

  return (
    <Layout>
      <h3>Edit User</h3>
      {user && <Form onSubmit={onSubmit} user={user} />}
    </Layout>
  );
});

export default EditUser;
