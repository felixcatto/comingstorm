import '../client/css/index.css'; // Import FIRST
import originalAxios from 'axios';
import { AppProps } from 'next/app';
import React from 'react';
import { interpret } from 'xstate';
import WssConnect from '../client/common/WssConnect.js';
import {
  currentUserInitialState,
  makeActions,
  makeCurrentUser,
  makeNotificationAnimationDuration,
  makeNotifications,
  makeSession,
  makeSignedInUsersIds,
} from '../client/lib/effectorStore.js';
import { Context, guestUser } from '../client/lib/utils.js';
import { makeSocketMachine, webSocketTypes } from '../client/lib/wsActor.js';
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
    const $notificationAnimationDuration = makeNotificationAnimationDuration(actions);

    const connectToWss = () => new WebSocket(process.env.NEXT_PUBLIC_WSS_URL!);
    const wsActor: any = interpret(makeSocketMachine(connectToWss, webSocketTypes.browser));

    return {
      axios,
      actions,
      wsActor,
      [makeCurrentUser.key]: $currentUser,
      [makeSignedInUsersIds.key]: makeSignedInUsersIds(actions),
      [makeNotificationAnimationDuration.key]: makeNotificationAnimationDuration(actions),
      [makeNotifications.key]: makeNotifications(actions, $notificationAnimationDuration),
      [makeSession.key]: makeSession($currentUser),
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
