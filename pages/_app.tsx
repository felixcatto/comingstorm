import originalAxios from 'axios';
import React from 'react';
import { makeSession, makeSessionActions } from '../client/common/sessionSlice';
import {
  makeSignedInUsersIds,
  makeWsClientStore,
  makeWsClientActions,
  makeWebSocketState,
} from '../client/common/wsSlice';
import { asyncStates, Context, getApiUrl, guestUser, makeSessionInfo } from '../client/lib/utils';
import { IActions, IContext } from '../lib/types';
import '../public/css/index.scss';
import WssConnect from '../client/common/WssConnect';
import { combine } from 'effector';

function App(appProps) {
  const { Component, pageProps } = appProps;
  const store = React.useMemo<IContext>(() => {
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
      $wsClient: makeWsClientStore(actions),
      $webSocketState: makeWebSocketState(actions),
      $isSignedInWss,
      $signedInUsersIds,
    };
  }, []);

  return (
    <Context.Provider value={store}>
      <WssConnect />
      <Component {...pageProps} />
    </Context.Provider>
  );
}

export default App;
