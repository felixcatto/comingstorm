import { GetServerSidePropsContext } from 'next';
import Layout from '../client/common/Layout.js';
import { keygrip, objection } from '../lib/init.js';
import { unwrap } from '../lib/sharedUtils.js';
import { getUserFromRequest } from '../lib/utils.js';

export async function getServerSideProps({ req, res }: GetServerSidePropsContext) {
  const currentUser = await getUserFromRequest(res, req.cookies, keygrip, objection.User);
  return {
    props: unwrap({ currentUser }),
  };
}

export default function Home(props) {
  return (
    <Layout>
      <div className="splash-screen"></div>
    </Layout>
  );
}
