import { GetServerSidePropsContext } from 'next';
import Layout from '../client/common/Layout';
import { keygrip, objection } from '../lib/init';
import { unwrap } from '../lib/sharedUtils';
import { getUserFromRequest } from '../lib/utils';

export async function getServerSideProps({ req, res }: GetServerSidePropsContext) {
  const currentUser = await getUserFromRequest(res, req.cookies, keygrip, objection.User);
  return {
    props: unwrap({ currentUser }),
  };
}

export default function Home(props) {
  return <Layout>Hello world</Layout>;
}
