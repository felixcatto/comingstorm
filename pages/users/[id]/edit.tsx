import { useRouter } from 'next/router';
import React from 'react';
import Layout from '../../../client/common/Layout';
import { getUrl } from '../../../client/lib/routes';
import { useContext, WithApiErrors } from '../../../client/lib/utils';
import Form from '../../../client/users/form';
import { keygrip, objection } from '../../../lib/init';
import { getUserFromRequest, unwrap } from '../../../lib/utils';
import { IUser } from '../../../models';

export async function getServerSideProps({ req, res }) {
  const { User } = objection;
  const currentUser = await getUserFromRequest(res, req.cookies, keygrip, User);
  return {
    props: unwrap({ currentUser }),
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
