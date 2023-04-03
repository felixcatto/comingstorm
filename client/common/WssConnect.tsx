import React from 'react';
import { getApiUrl, useContext, useRefreshPage, wsEvents } from '../lib/utils.js';
import { onMessageEvent, send } from '../lib/wsActor.js';

const WssConnect = () => {
  const { wsActor, actions, axios } = useContext();
  const refreshPage = useRefreshPage();

  React.useEffect(() => {
    wsActor.start();
  }, []);

  React.useEffect(() => {
    actions.signIn.done.watch(async () => {
      const data = await axios.get(getApiUrl('session'));
      send(wsActor, wsEvents.signIn, data);
    });

    actions.signOut.done.watch(payload => {
      send(wsActor, wsEvents.signOut, { id: payload.result.signOutUserId });
    });
  }, []);

  React.useEffect(() => {
    const updateUnreadMessages = refreshPage;

    const onMessage = onMessageEvent(({ type, payload }) => {
      switch (type) {
        case wsEvents.signedInUsersIds:
          actions.wssUpdateSignedUsers(payload);
          break;
        case wsEvents.newMessagesArrived:
          updateUnreadMessages();
          break;
        default:
          console.log(`receive event with type "${type}", but have no handler -> ${payload}`);
          break;
      }
    });

    wsActor.onEvent(onMessage);
    return () => {
      wsActor.off(onMessage);
    };
  }, [refreshPage]);

  return null;
};

export default WssConnect;
