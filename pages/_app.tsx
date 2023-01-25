import '../public/css/index.scss';
import type { AppProps } from 'next/app';
import originalAxios from 'axios';
import React from 'react';
import { useStore } from 'effector-react';
import { roles, asyncStates, makeSessionInfo, useContext, Context } from '../client/lib/utils';
import { getApiUrl } from '../client/lib/routes';
import { makeSession, makeSessionActions } from '../client/common/sessionSlice';

function App(appProps) {
  const { Component, pageProps } = appProps;
  const { currentUser } = pageProps;

  const { store } = React.useMemo(() => {
    const axios = originalAxios.create();
    axios.interceptors.response.use(
      response => response.data,
      error => {
        console.log(error.response);
        return Promise.reject(error);
      }
    );

    const actions = [makeSessionActions].reduce(
      (acc, makeActions) => ({
        ...acc,
        ...makeActions({ getApiUrl, axios }),
      }),
      {}
    );

    const store = {
      getApiUrl,
      axios,
      actions,
      $session: makeSession(actions, {
        ...makeSessionInfo(currentUser),
        status: asyncStates.resolved,
        errors: null,
      }),
    };

    return { store };
  }, []);

  return (
    <Context.Provider value={store}>
      <Component {...pageProps} />
    </Context.Provider>
  );
}

export default App;
