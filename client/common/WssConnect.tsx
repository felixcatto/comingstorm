import { useStore } from 'effector-react';
import React from 'react';
import {
  decode,
  encode,
  getApiUrl,
  socketStates,
  useContext,
  useRefreshPage,
  wsEvents,
  wsGeneralEvents,
} from '../lib/utils.js';

const WssConnect = () => {
  const { $ws, actions, axios } = useContext();
  const { webSocket, webSocketState } = useStore($ws);
  const refreshPage = useRefreshPage();

  React.useEffect(() => {
    const webSocket = new WebSocket(process.env.NEXT_PUBLIC_WSS_URL!);
    actions.setWebSocket(webSocket);
  }, []);

  React.useEffect(() => {
    if (!webSocket) return;

    const onOpen = () => actions.updateWsState(webSocket);
    const onClose = () => actions.setWebSocket(null);
    webSocket.addEventListener(wsGeneralEvents.open, onOpen);
    webSocket.addEventListener(wsGeneralEvents.close, onClose);

    return () => {
      webSocket.removeEventListener(wsGeneralEvents.open, onOpen);
      webSocket.removeEventListener(wsGeneralEvents.close, onClose);
    };
  }, [webSocket]);

  React.useEffect(() => {
    if (webSocketState !== socketStates.open) return;
    const unwatchSignIn = actions.signIn.done.watch(() => {
      axios.get(getApiUrl('session')).then(data => {
        webSocket.send(encode(wsEvents.signIn, data));
      });
    });
    const unwatchSignOut = actions.signOut.done.watch(payload => {
      webSocket.send(encode(wsEvents.signOut, { id: payload.result.signOutUserId }));
    });
    return () => {
      unwatchSignIn();
      unwatchSignOut();
    };
  }, [webSocket, webSocketState]);

  React.useEffect(() => {
    if (!webSocket) return;

    const updateUnreadMessages = refreshPage;
    const onMessage = msgBuffer => {
      const { type, payload } = decode(msgBuffer);
      switch (type) {
        case wsEvents.signedInUsersIds:
          actions.wssUpdateSignedUsers(payload);
          break;
        case wsEvents.newMessagesArrived:
          updateUnreadMessages();
          break;
        default:
          console.log(`
            receive event with type "${type}", but have no handler
            -> ${payload}`);
          break;
      }
    };

    webSocket.addEventListener(wsGeneralEvents.message, onMessage);
    return () => webSocket.removeEventListener(wsGeneralEvents.message, onMessage);
  }, [webSocket, refreshPage]);

  React.useEffect(() => {
    if (webSocketState !== socketStates.open) return;
    webSocket.send(encode(wsEvents.getSignedInUsersIds));
  }, [webSocketState]);

  return null;
};

export default WssConnect;
