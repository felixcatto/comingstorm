import '../public/css/index.scss';
import type { AppProps } from 'next/app';
import originalAxios from 'axios';
import { SWRConfig } from 'swr';
import { useStore } from 'effector-react';
import { roles, asyncStates, makeSessionInfo, useContext, Context } from '../client/lib/utils';
import { getApiUrl } from '../client/lib/routes';
import { makeSession, makeSessionActions } from '../client/common/sessionSlice';
import knexConfig from '../knexfile';

function App(appProps) {
  const { Component, currentUser } = appProps;

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

  const swrConfig = { fetcher: axios.get, revalidateOnFocus: false };

  return (
    <Context.Provider value={store}>
      <SWRConfig value={swrConfig}>
        <Component />
      </SWRConfig>
    </Context.Provider>
  );
}

App.getInitialProps = async ctx => {
  const guestUser = {
    id: '-1',
    name: 'Guest',
    role: roles.guest,
    email: '',
    password_digest: '',
  };
  const currentUser = guestUser;
  return { currentUser };
};

export default App;
