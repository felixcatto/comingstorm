import { useStore } from 'effector-react';
import React from 'react';
import {
  getApiUrl,
  makeWsClient,
  socketStates,
  useContext,
  wsEvents,
  wsGeneralEvents,
} from '../lib/utils.js';

const WssConnect = () => {
  const { $ws, actions, $session, $isSignedInWss, axios } = useContext();
  const { isSignedIn } = useStore($session);
  const { wsClient, webSocketState } = useStore($ws);
  const isSignedInWss = useStore($isSignedInWss);

  React.useEffect(() => {
    const wsClient = makeWsClient(process.env.NEXT_PUBLIC_WSS_URL);
    actions.setWsClient(wsClient);
  }, []);

  React.useEffect(() => {
    if (webSocketState !== socketStates.open) return;
    const unwatchSignIn = actions.signIn.done.watch(payload => {
      axios.get(getApiUrl('session')).then(data => {
        wsClient!.emit(wsEvents.signIn, data);
      });
    });
    const unwatchSignOut = actions.signOut.done.watch(payload => {
      wsClient!.emit(wsEvents.signOut, { id: payload.result.signOutUserId });
    });
    return () => {
      unwatchSignIn();
      unwatchSignOut();
    };
  }, [wsClient, webSocketState]);

  React.useEffect(() => {
    if (!wsClient) return;

    wsClient.on(wsGeneralEvents.open, () => {
      actions.updateWsState(wsClient.socket.readyState);
    });
    wsClient.on(wsGeneralEvents.close, () => {
      actions.setWsClient(null);
    });
    wsClient.on(wsEvents.signedInUsersIds, data => {
      actions.wssUpdateSignedUsers(data);
    });
    wsClient.on(wsEvents.newMessagesArrived, data => {
      console.log(data); // TODO: ???
    });
  }, [wsClient]);

  React.useEffect(() => {
    if (webSocketState !== socketStates.open) return;
    wsClient!.emit(wsEvents.getSignedInUsersIds);
  }, [webSocketState]);

  return null;
};

export default WssConnect;
