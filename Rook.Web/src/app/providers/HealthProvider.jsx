import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { API_URL } from '@services/api/config.js'
import { useAuth } from './AuthProvider.jsx'

// While healthy: check infrequently, since the backend being fine is the
// overwhelmingly common case and there's no benefit to hammering it just
// to keep confirming that. The moment a check fails, ramp straight to the
// fast cadence — that's when actually knowing "are we back yet" quickly
// matters — and drop back to slow again the instant it recovers.
const HEALTHY_INTERVAL_MS = 120000
const FAILURE_INTERVAL_MS = 5000

// status: 'idle' (not authenticated, nothing to check) | 'checking' (no
// result yet — briefly on mount, before the first response) | 'online' |
// 'offline'.
//
// Deliberately a plain, unauthenticated fetch — not via useApiFetch, which
// attaches a bearer token and does 401-refresh-retry logic that doesn't
// apply to a bare liveness ping. /health returns ok with no auth
// regardless of session state, which is the whole point: it answers
// "is the backend up" without tangling that up with "is my session valid".
const HealthContext = createContext({ status: 'idle', reportPossibleOutage: () => {} })

function HealthProvider({ children }) {
  const { accessToken } = useAuth()
  const isAuthenticated = Boolean(accessToken)
  const [status, setStatus] = useState('idle')
  // Populated inside the effect below with whatever "cancel the pending
  // wait and check right now" currently means — a stable ref rather than
  // exposing the effect's own locals directly, since those get recreated
  // every time the effect re-runs (e.g. on login/logout).
  const triggerRef = useRef(() => {})

  useEffect(() => {
    if (!isAuthenticated) {
      setStatus('idle')
      triggerRef.current = () => {}
      return
    }

    let cancelled = false
    let timerId = null
    setStatus('checking')

    function scheduleNext(wasOk) {
      if (cancelled) return
      timerId = setTimeout(check, wasOk ? HEALTHY_INTERVAL_MS : FAILURE_INTERVAL_MS)
    }

    async function check() {
      try {
        // no-store: some browsers/proxies are happy to serve a cached
        // response for a plain GET, which would be exactly backwards for
        // a liveness check — the whole point is asking fresh every time.
        const response = await fetch(`${API_URL}/api/health`, { cache: 'no-store' })
        if (cancelled) return
        setStatus(response.ok ? 'online' : 'offline')
        scheduleNext(response.ok)
      } catch (error) {
        // Logged rather than swallowed — a CORS rejection and an actual
        // network failure both surface as a generic fetch error with no
        // other signal, so seeing this in the console is often the only
        // way to tell which one it actually was.
        console.log('/health check failed', error)
        if (cancelled) return
        setStatus('offline')
        scheduleNext(false)
      }
    }

    // Cancels whatever's still pending and checks immediately — used by
    // both the tab-visibility handler below and, externally via
    // reportPossibleOutage, by useApiFetch whenever a real request fails
    // outright. Either way the outcome of *this* check is what decides
    // the next interval, same as any other check — no separate "forced"
    // state to track.
    function checkNow() {
      if (timerId) clearTimeout(timerId)
      check()
    }

    triggerRef.current = checkNow
    check()

    // A backgrounded tab could otherwise sit on a stale "healthy" result
    // for up to the full 2-minute interval after regaining focus.
    function onVisible() {
      if (document.visibilityState === 'visible') checkNow()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      if (timerId) clearTimeout(timerId)
      document.removeEventListener('visibilitychange', onVisible)
      triggerRef.current = () => {}
    }
  }, [isAuthenticated])

  // Stable across renders (reads through the ref rather than closing over
  // anything from a specific effect run) — safe to depend on from a
  // consumer like useApiFetch without it causing spurious re-runs there.
  const reportPossibleOutage = useCallback(() => {
    triggerRef.current()
  }, [])

  return (
    <HealthContext.Provider value={{ status, reportPossibleOutage }}>
      {children}
    </HealthContext.Provider>
  )
}

function useHealthContext() {
  return useContext(HealthContext)
}

export { HealthProvider, useHealthContext }
