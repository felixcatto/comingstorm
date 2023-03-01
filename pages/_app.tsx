import '../public/css/index.css';
import originalAxios from 'axios';
import { combine } from 'effector';
import { AppProps } from 'next/app';
import React from 'react';
import { makeSession, makeSessionActions } from '../client/common/sessionSlice.js';
import WssConnect from '../client/common/WssConnect.js';
import { makeSignedInUsersIds, makeWs, makeWsClientActions } from '../client/common/wsSlice.js';
import {
  asyncStates,
  Context,
  getApiUrl,
  guestUser,
  makeSessionInfo,
} from '../client/lib/utils.js';
import { IActions, IContext, IPageProps } from '../lib/types.js';

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
        return Promise.reject(error);
      }
    );

    const actions = [makeSessionActions, makeWsClientActions].reduce(
      (acc, makeActions) => ({
        ...acc,
        ...makeActions({ getApiUrl, axios }),
      }),
      {} as IActions
    );

    const $session = makeSession(actions, {
      ...makeSessionInfo(currentUser),
      status: asyncStates.resolved,
      errors: null,
    });
    const $signedInUsersIds = makeSignedInUsersIds(actions);
    const $isSignedInWss = combine(
      $session,
      $signedInUsersIds,
      (session, signedInUsersIds) =>
        signedInUsersIds.findIndex(userId => session.currentUser.id === userId) !== -1
    );

    return {
      getApiUrl,
      axios,
      actions,
      $session,
      $ws: makeWs(actions),
      $isSignedInWss,
      $signedInUsersIds,
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
