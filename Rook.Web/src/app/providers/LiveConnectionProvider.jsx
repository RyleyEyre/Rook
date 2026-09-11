import { createContext, useContext, useEffect, useState } from 'react'
import { HubConnectionBuilder } from '@microsoft/signalr'
import { HUB_URL } from '@services/api/config.js'
import { useAuth } from './AuthProvider.jsx'

// { connection, connectionId }. `connection` is null whenever the hub
// isn't actually connected (including mid-reconnect) — consumers
// (useLiveConnection, useApiFetch) treat that as "not live yet" rather
// than reaching for a half-open connection.
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

    let cancelled = false
    let retryTimer = null
    let hub = null

    function connect() {
      hub = new HubConnectionBuilder()
        .withUrl(HUB_URL, {
          accessTokenFactory: () => sessionStorage.getItem('accessToken'),
        })
        .withAutomaticReconnect()
        .build()

      hub.onreconnecting(() => {
        if (cancelled) return
        setConnection(null)
        setConnectionId(null)
      })
      hub.onreconnected(() => {
        if (cancelled) return
        setConnectionId(hub.connectionId)
        setConnection(hub)
      })
      hub.onclose(() => {
        if (cancelled) return
        // withAutomaticReconnect() only retries through its own built-in
        // sequence (a handful of attempts over ~30s) before giving up for
        // good and firing this — it will not try again on its own.
        // Without restarting the whole thing ourselves here, a person
        // would stay disconnected from real-time updates forever after
        // any outage longer than that, even once the backend came back.
        setConnection(null)
        setConnectionId(null)
        retryTimer = setTimeout(connect, 5000)
      })

      hub.start()
        .then(() => {
          if (cancelled) return
          setConnectionId(hub.connectionId)
          setConnection(hub)
        })
        .catch((error) => {
          console.log('SignalR connection error', error)
          if (cancelled) return
          retryTimer = setTimeout(connect, 5000)
        })
    }

    connect()

    return () => {
      cancelled = true
      if (retryTimer) clearTimeout(retryTimer)
      setConnection(null)
      setConnectionId(null)
      hub?.stop()
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
