import { useStore } from 'effector-react';
import Link from 'next/link';
import Layout from '../../client/common/Layout.js';
import { getUrl, isSignedIn, unwrap, useContext, useRefreshPage } from '../../client/lib/utils.js';
import { keygrip, objection } from '../../lib/init.js';
import { ITag } from '../../lib/types.js';
import { getUserFromRequest } from '../../lib/utils.js';

type ITagsProps = {
  tags: ITag[];
};

export async function getServerSideProps({ req, res }) {
  const { Tag, User } = objection;
  const currentUser = await getUserFromRequest(res, req.cookies, keygrip, User);
  let unreadMessages: any = [];
  if (isSignedIn(currentUser)) {
    unreadMessages = await objection.UnreadMessage.query().where('receiver_id', currentUser.id);
  }
  const tags = await Tag.query();
  return {
    props: unwrap({ currentUser, tags, unreadMessages }),
  };
}

const Tags = ({ tags }: ITagsProps) => {
  const { $session, getApiUrl, axios } = useContext();
  const { isSignedIn } = useStore($session);
  const refreshPage = useRefreshPage();

  const deleteTag = id => async () => {
    await axios.delete(getApiUrl('tag', { id }));
    refreshPage();
  };

  return (
    <Layout>
      <h3>Tags List</h3>

      {isSignedIn && (
        <Link href={getUrl('newTag')} className="btn mb-6">
          Create new tag
        </Link>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            {isSignedIn && <th className="text-right">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {tags?.map(tag => (
            <tr key={tag.id}>
              <td>{tag.name}</td>
              {isSignedIn && (
                <td>
                  <div className="flex justify-end">
                    <Link
                      href={getUrl('editTag', { id: tag.id })}
                      className="btn btn_sm btn_outline mr-2"
                    >
                      Edit Tag
                    </Link>
                    <div className="btn btn_sm btn_outline" onClick={deleteTag(tag.id)}>
                      Remove Tag
                    </div>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
};

export default Tags;
