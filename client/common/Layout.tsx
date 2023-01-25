import Head from 'next/head';
import Link from 'next/link';
import { getUrl } from '../lib/routes';
import { NavLink } from '../lib/utils';
import cn from 'classnames';
import { useContext, userRolesToIcons } from '../lib/utils';
import { useStore } from 'effector-react';

export default function Layout({ children }) {
  const { $session, actions } = useContext();
  const { currentUser, isSignedIn } = useStore($session);
  const userIconClass = role => cn('app__user-role-icon mr-5', userRolesToIcons[role]);

  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="app">
        <div className="app__header">
          <div className="container app__header-fg">
            <div className="d-flex align-items-center">
              <img src="/img/storm.svg" className="app__logo mr-30" />
              <div className="d-flex">
                <NavLink href={getUrl('home')}>Home</NavLink>
                <NavLink href={getUrl('users')}>Users</NavLink>
                <NavLink href={getUrl('articles')}>Articles</NavLink>
                <NavLink href={getUrl('tags')}>Tags</NavLink>
              </div>
            </div>
            {isSignedIn ? (
              <div className="d-flex align-items-center">
                <i className={userIconClass(currentUser.role)}></i>
                <div className="app__user-name mr-10">{currentUser.name}</div>
                <i
                  className="fa fa-sign-out-alt app__sign-icon"
                  title="Sign out"
                  onClick={() => actions.signOut()}
                ></i>
              </div>
            ) : (
              <Link href={getUrl('newSession')} className="app__sign-in">
                <div className="app__sign-in-text">Sign In</div>
                <i className="fa fa-sign-in-alt app__sign-icon" title="Sign in"></i>
              </Link>
            )}
          </div>
        </div>
        <div className="container app__body">{children}</div>
      </div>
    </>
  );
}
