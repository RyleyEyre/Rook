import { useEffect, useRef } from 'react';
import { useLiveConnectionContext } from '@app/providers/LiveConnectionProvider.jsx';

// Joins `groupName` on the app's one shared hub connection (see
// LiveConnectionProvider) and wires up `eventHandlers` for as long as this
// component is mounted. Previously each page opened and owned its own
// HubConnection; now the connection is a singleton so its connectionId can
// be attached to outgoing REST calls (see useApiFetch.js) — this hook just
// borrows it for a group subscription.
function useLiveConnection(groupName, eventHandlers) {
    const { connection, connectionId } = useLiveConnectionContext();

    // Kept in a ref so the effect below — which only needs to re-run when
    // the connection instance, connectionId, or groupName actually change —
    // always calls whatever handlers were most recently passed in, without
    // needing them in its dependency array (they're a fresh object every
    // render).
    const handlersRef = useRef(eventHandlers);
    handlersRef.current = eventHandlers;

    useEffect(() => {
        if (!connection) return; // not connected yet — effect re-runs once it is

        const bound = {};
        for (const eventName of Object.keys(handlersRef.current)) {
            const fn = (...args) => handlersRef.current[eventName]?.(...args);
            bound[eventName] = fn;
            connection.on(eventName, fn);
        }

        connection.invoke('JoinGroup', groupName)
            .catch((error) => console.log('SignalR join group error', error));

        return () => {
            for (const [eventName, fn] of Object.entries(bound)) {
                connection.off(eventName, fn);
            }
            // Best-effort — if the hub doesn't expose LeaveGroup this just
            // rejects quietly and the group membership is cleaned up
            // whenever the underlying connection eventually closes instead.
            connection.invoke('LeaveGroup', groupName).catch(() => {});
        };
        // connectionId is in this array deliberately, not just connection —
        // SignalR's automatic reconnect (a brief network blip recovering on
        // its own) keeps the *same* HubConnection object but assigns a new
        // connectionId internally, and group membership isn't preserved
        // across that reconnect server-side. Without connectionId here,
        // `connection` alone never looks "changed" (same reference), so
        // this effect wouldn't re-run and JoinGroup would never fire again
        // after a reconnect — silently dropping this connection out of the
        // group until the next full page reload, with no visible error.
    }, [connection, connectionId, groupName]);

    return connection;
}

export { useLiveConnection };
