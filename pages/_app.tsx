import '../client/css/index.css';    // Import FIRST
import originalAxios from 'axios';
import { AppProps } from 'next/app';
import React from 'react';
import WssConnect from '../client/common/WssConnect.js';
import {
  currentUserInitialState,
  makeActions,
  makeCurrentUser,
  makeIsSignedInWss,
  makeSession,
  makeSignedInUsersIds,
  makeWs,
} from '../client/lib/effectorStore.js';
import { Context, guestUser } from '../client/lib/utils.js';
import { IContext, IPageProps } from '../lib/types.js';
import '../client/css/tailwind.css'; // Import LAST

function App(appProps: AppProps<IPageProps>) {
  const { Component, pageProps } = appProps;
  const { unreadMessages } = pageProps;
  const staticStore = React.useMemo(() => {
    const currentUser = pageProps.currentUser || guestUser;
    if (!pageProps.currentUser) {
      console.warn('beware, no currentUser detected');
    }

    const axios = originalAxios.create();
    axios.interceptors.response.use(
      response => response.data,
      error => {
        console.log(error.response);
        return Promise.reject(error.response.data);
      }
    );

    const actions = makeActions({ axios });
    const $currentUser = makeCurrentUser(actions, {
      ...currentUserInitialState,
      data: currentUser,
    });
    const $signedInUsersIds = makeSignedInUsersIds(actions);

    return {
      axios,
      actions,
      [makeCurrentUser.key]: $currentUser,
      [makeWs.key]: makeWs(actions),
      [makeSignedInUsersIds.key]: $signedInUsersIds,
      [makeSession.key]: makeSession($currentUser),
      [makeIsSignedInWss.key]: makeIsSignedInWss($currentUser, $signedInUsersIds),
    };
  }, []);

  const store: IContext = { ...staticStore, unreadMessages };

  return (
    <Context.Provider value={store}>
      <WssConnect />
      <Component {...pageProps} />
    </Context.Provider>
  );
}

export default App;
