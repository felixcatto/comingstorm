import { GetServerSidePropsContext } from 'next';
import Image from 'next/image.js';
import Layout from '../client/common/Layout.js';
import { keygrip, objection } from '../lib/init.js';
import { getUserFromRequest, isSignedIn, unwrap } from '../lib/utils.js';

export async function getServerSideProps({ req, res }: GetServerSidePropsContext) {
  const currentUser = await getUserFromRequest(res, req.cookies, keygrip, objection.User);
  let unreadMessages: any = [];
  if (isSignedIn(currentUser)) {
    unreadMessages = await objection.UnreadMessage.query().where('receiver_id', currentUser.id);
  }
  return {
    props: unwrap({ currentUser, unreadMessages }),
  };
}

export default function Home() {
  return (
    <Layout>
      <div className="splash-screen">
        <Image src="/img/s3.png" className="splash-screen__img" quality={95} fill priority alt="" />
      </div>
    </Layout>
  );
}
