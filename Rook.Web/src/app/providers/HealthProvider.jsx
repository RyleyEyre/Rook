import { createContext, useContext, useEffect, useState } from 'react'
import { API_URL } from '@services/api/config.js'
import { useAuth } from './AuthProvider.jsx'

const HEALTH_CHECK_INTERVAL_MS = 5000

// status: 'idle' (not authenticated, nothing to check) | 'checking' (no
// result yet — briefly on mount, before the first response) | 'online' |
// 'offline'.
//
// Deliberately a plain, unauthenticated fetch — not via useApiFetch, which
// attaches a bearer token and does 401-refresh-retry logic that doesn't
// apply to a bare liveness ping. /health returns ok with no auth
// regardless of session state, which is the whole point: it answers
// "is the backend up" without tangling that up with "is my session valid".
const HealthContext = createContext({ status: 'idle' })

function HealthProvider({ children }) {
  const { accessToken } = useAuth()
  const isAuthenticated = Boolean(accessToken)
  const [status, setStatus] = useState('idle')

  useEffect(() => {
    if (!isAuthenticated) {
      setStatus('idle')
      return
    }

    let cancelled = false
    setStatus('checking')

    async function check() {
      try {
        // no-store: some browsers/proxies are happy to serve a cached
        // response for a plain GET, which would be exactly backwards for
        // a liveness check — the whole point is asking fresh every time.
        const response = await fetch(`${API_URL}/api/health`, { cache: 'no-store' })
        if (cancelled) return
        setStatus(response.ok ? 'online' : 'offline')
      } catch (error) {
        // Logged rather than swallowed — a CORS rejection and an actual
        // network failure both surface as a generic fetch error with no
        // other signal, so seeing this in the console is often the only
        // way to tell which one it actually was.
        console.log('/health check failed', error)
        if (!cancelled) setStatus('offline')
      }
    }

    check()
    const intervalId = setInterval(check, HEALTH_CHECK_INTERVAL_MS)

    // setInterval alone can badly undershoot its schedule in a
    // backgrounded tab — browsers throttle background timers, sometimes
    // down to once a minute, which could stretch "detect we're back
    // online" out past the watchdog's own give-up window. Re-checking
    // immediately the moment the tab becomes visible again closes that
    // gap regardless of how throttled the interval was while it was
    // hidden.
    function onVisible() {
      if (document.visibilityState === 'visible') check()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [isAuthenticated])

  return <HealthContext.Provider value={{ status }}>{children}</HealthContext.Provider>
}

function useHealthContext() {
  return useContext(HealthContext)
}

export { HealthProvider, useHealthContext }
