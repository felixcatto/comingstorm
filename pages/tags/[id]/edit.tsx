import { useRouter } from 'next/router';
import React from 'react';
import Layout from '../../../client/common/Layout.js';
import {
  getApiUrl,
  isSignedIn,
  useContext,
  useSubmit,
  WithApiErrors,
} from '../../../client/lib/utils.js';
import Form from '../../../client/tags/form.js';
import { keygrip, objection } from '../../../lib/init.js';
import { ITag } from '../../../lib/types.js';
import { getUrl, getUserFromRequest, unwrap } from '../../../lib/utils.js';

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

const EditTag = () => {
  const { axios } = useContext();
  const router = useRouter();
  const [tag, setTag] = React.useState<ITag | null>(null);
  const { id } = router.query;

  React.useEffect(() => {
    axios.get(getApiUrl('tag', { id })).then(data => setTag(data));
  }, []);

  const onSubmit = useSubmit(async values => {
    await axios.put(getApiUrl('tag', { id: tag!.id }), values);
    router.push(getUrl('tags'));
  });

  return (
    <Layout>
      <h3>Edit Tag</h3>
      {tag && <Form onSubmit={onSubmit} tag={tag} />}
    </Layout>
  );
};

export default WithApiErrors(EditTag);
