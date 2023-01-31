import originalAxios from 'axios';
import React from 'react';
import { makeSession, makeSessionActions } from '../client/common/sessionSlice';
import { asyncStates, Context, getApiUrl, guestUser, makeSessionInfo } from '../client/lib/utils';
import '../public/css/index.scss';

function App(appProps) {
  const { Component, pageProps } = appProps;

  const { store } = React.useMemo(() => {
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
