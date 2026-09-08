import { createContext, useContext, useEffect, useState } from 'react'
import { HubConnectionBuilder } from '@microsoft/signalr'
import { HUB_URL } from '@services/api/config.js'
import { useAuth } from './AuthProvider.jsx'

// { connection, connectionId }. `connection` is null until the hub has
// actually finished connecting — consumers (useLiveConnection,
// useApiFetch) treat that as "not live yet" rather than reaching for a
// half-open connection.
const LiveConnectionContext = createContext({ connection: null, connectionId: null })

function LiveConnectionProvider({ children }) {
  const { accessToken } = useAuth()
  // Gate on *whether* we're authenticated, not on the token string itself —
  // the token rotates on every silent refresh, and we don't want to tear
  // down and rebuild the socket (and every page's group membership) each
  // time that happens. accessTokenFactory below reads the live token from
  // sessionStorage at connect/reconnect time regardless.
  const isAuthenticated = Boolean(accessToken)

  const [connection, setConnection] = useState(null)
  const [connectionId, setConnectionId] = useState(null)

  useEffect(() => {
    if (!isAuthenticated) {
      setConnection(null)
      setConnectionId(null)
      return
    }

    const hub = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => sessionStorage.getItem('accessToken'),
      })
      .withAutomaticReconnect()
      .build()

    hub.onreconnected(() => setConnectionId(hub.connectionId))
    hub.onclose(() => setConnectionId(null))

    let cancelled = false

    hub.start()
      .then(() => {
        if (cancelled) return
        setConnectionId(hub.connectionId)
        setConnection(hub)
      })
      .catch((error) => console.log('SignalR connection error', error))

    return () => {
      cancelled = true
      setConnection(null)
      setConnectionId(null)
      hub.stop()
    }
  }, [isAuthenticated])

  return (
    <LiveConnectionContext.Provider value={{ connection, connectionId }}>
      {children}
    </LiveConnectionContext.Provider>
  )
}

function useLiveConnectionContext() {
  return useContext(LiveConnectionContext)
}

export { LiveConnectionProvider, useLiveConnectionContext }
