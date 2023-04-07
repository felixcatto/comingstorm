import { useRouter } from 'next/router.js';
import React from 'react';
import { makeNotification, messageNotification } from '../components/Notifications.jsx';
import { getApiUrl, getUrl, useContext, useRefreshPage, wsEvents } from '../lib/utils.js';
import { onMessageEvent, send } from '../lib/wsActor.js';

const WssConnect = () => {
  const { wsActor, actions, axios } = useContext();
  const refreshPage = useRefreshPage();
  const router = useRouter();

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

    const onMessage = onMessageEvent(async ({ type, payload }) => {
      switch (type) {
        case wsEvents.signedInUsersIds:
          actions.wssUpdateSignedUsers(payload);
          break;

        case wsEvents.newMessagesArrived:
          if (getUrl('messages') === router.asPath) return; // we have custom logic on this page

          updateUnreadMessages();

          const { senderId } = payload;
          const sender = await axios.get(getApiUrl('user', { id: senderId }, { withAvatar: true }));
          actions.addNotification(
            makeNotification({ title: 'New Message From', component: messageNotification(sender) })
          );
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
