import { useEffect, useRef } from 'react';
import { HubConnectionBuilder } from '@microsoft/signalr';
import { HUB_URL } from './config';

function useLiveConnection(groupName, eventHandlers) {
    const connectionRef = useRef(null);

    useEffect(() => {
        const connection = new HubConnectionBuilder()
            .withUrl(HUB_URL, {
                accessTokenFactory: () => sessionStorage.getItem('accessToken'),
            })
            .withAutomaticReconnect()
            .build();

        Object.entries(eventHandlers).forEach(([eventName, handler]) => {
            connection.on(eventName, handler);
        });

        connection.start()
            .then(() => connection.invoke('JoinGroup', groupName))
            .catch((error) => console.log('SignalR connection error', error));

        connectionRef.current = connection;

        return () => {
            connection.stop();
        };
    }, [groupName]);

    return connectionRef;
}

export { useLiveConnection };