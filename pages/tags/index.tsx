import { useStore } from 'effector-react';
import Link from 'next/link';
import Layout from '../../client/common/Layout';
import { getUrl, unwrap, useContext, useRefreshPage } from '../../client/lib/utils';
import { keygrip, objection } from '../../lib/init';
import { getUserFromRequest } from '../../lib/utils';
import { ITag } from '../../models';

type ITagsProps = {
  tags: ITag[];
};

export async function getServerSideProps({ req, res }) {
  const { Tag, User } = objection;
  const currentUser = await getUserFromRequest(res, req.cookies, keygrip, User);
  const tags = await Tag.query();
  return {
    props: unwrap({ currentUser, tags }),
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
        <Link href={getUrl('newTag')} className="d-inline-block mb-30">
          <button className="btn btn-primary">Create new tag</button>
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
                  <div className="d-flex justify-content-end">
                    <Link
                      href={getUrl('editTag', { id: tag.id })}
                      className="btn btn-sm btn-outline-primary mr-10"
                    >
                      Edit Tag
                    </Link>
                    <div className="btn btn-sm btn-outline-primary" onClick={deleteTag(tag.id)}>
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
