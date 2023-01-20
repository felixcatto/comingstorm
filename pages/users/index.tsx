import Layout from '../../client/common/Layout';
import cn from 'classnames';
import { useStore } from 'effector-react';
import Link from 'next/link';
import { getUrl } from '../../client/lib/routes';
import { IUser } from '../../client/lib/types';
import { dedup, useContext, userRolesToIcons, useSWR } from '../../client/lib/utils';

const userIconClass = role => cn('mr-5', userRolesToIcons[role]);

const Users = () => {
  const { $session, getApiUrl, axios } = useContext();
  const { isAdmin } = useStore<any>($session);
  const { data: users, mutate } = useSWR<IUser[]>(getApiUrl('users'));
  // console.log(users);

  const deleteUser = id =>
    dedup(async () => {
      await axios.delete(getApiUrl('user', { id }));
      mutate();
    });

  return (
    <Layout>
      <h3>Users List</h3>

      {isAdmin && (
        <Link href={getUrl('newUser')} className="d-inline-block mb-30">
          <button className="btn btn-primary">Create new user</button>
        </Link>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Email</th>
            {isAdmin && <th className="text-right">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {users?.map(user => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>
                <div className="d-flex align-items-center">
                  <i className={userIconClass(user.role)}></i>
                  <div>{user.role}</div>
                </div>
              </td>
              <td>{user.email}</td>
              {isAdmin && (
                <td>
                  <div className="d-flex justify-content-end">
                    <Link
                      href={getUrl('editUser', { id: user.id })}
                      className="btn btn-sm btn-outline-primary mr-10"
                    >
                      Edit user
                    </Link>
                    <div className="btn btn-sm btn-outline-primary" onClick={deleteUser(user.id)}>
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
