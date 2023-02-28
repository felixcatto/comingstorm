import cn from 'classnames';
import { useStore } from 'effector-react';
import Link from 'next/link';
import Layout from '../../client/common/Layout';
import {
  dedup,
  getUrl,
  unwrap,
  useContext,
  useRefreshPage,
  userRolesToIcons,
} from '../../client/lib/utils';
import s from './styles.module.css';
import { keygrip, objection } from '../../lib/init';
import { IUser } from '../../lib/types';
import { getUserFromRequest } from '../../lib/utils';

type IUsersProps = {
  users: IUser[];
};

export async function getServerSideProps({ req, res }) {
  const { User } = objection;
  const currentUser = await getUserFromRequest(res, req.cookies, keygrip, User);
  const users = await User.query();
  return {
    props: unwrap({ currentUser, users }),
  };
}

const userIconClass = role => cn('mr-1', userRolesToIcons[role]);

const Users = ({ users }: IUsersProps) => {
  const { $session, getApiUrl, axios, $signedInUsersIds } = useContext();
  const signedInUsersIds = useStore($signedInUsersIds);
  const { isAdmin } = useStore($session);
  const refreshPage = useRefreshPage();

  const deleteUser = id =>
    dedup(async () => {
      await axios.delete(getApiUrl('user', { id }));
      refreshPage();
    });
  const onlineIconClass = userId =>
    cn('online-icon mx-auto', {
      ['online-icon_online']: signedInUsersIds.includes(userId),
    });

  return (
    <Layout>
      <h3>Users List</h3>

      {isAdmin && (
        <Link href={getUrl('newUser')} className="btn mb-6">
          Create new user
        </Link>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Name</th>
            <th>Role</th>
            <th>Email</th>
            {isAdmin && <th className="text-right">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {users?.map(user => (
            <tr key={user.id}>
              <td className={s.isOnlineCell}>
                <i className={onlineIconClass(user.id)}></i>
              </td>
              <td>{user.name}</td>
              <td>
                <div className="flex items-center">
                  <i className={userIconClass(user.role)}></i>
                  <div>{user.role}</div>
                </div>
              </td>
              <td>{user.email}</td>
              {isAdmin && (
                <td>
                  <div className="flex justify-end">
                    <Link
                      href={getUrl('editUser', { id: user.id })}
                      className="btn btn_sm btn_outline mr-2"
                    >
                      Edit user
                    </Link>
                    <div className="btn btn_sm btn_outline" onClick={deleteUser(user.id)}>
                      Remove user
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

export default Users;
