import { useEffect, useRef } from 'react'
import { useHealthContext } from '@app/providers/HealthProvider.jsx'

// Runs `load` once on mount, and automatically re-runs it the instant the
// shared /health check (see HealthProvider) comes back 'online' after
// having been down — that's the "auto-refresh once the backend's back"
// behavior, with no page-level polling of its own. A second, independent
// retry loop hitting this page's own REST endpoint would just be a
// redundant way of asking the same "are we back online" question the
// shared health status already answers.
//
// `load` must reject on failure (not swallow its own error) — that's the
// only signal this hook has that an attempt failed and a reconnect should
// trigger a retry. It's fine for `load` to also do its own thing on
// failure first (e.g. set an error banner) as long as it rethrows after.
function useResilientLoad(load) {
  const { status } = useHealthContext()
  const loadRef = useRef(load)
  loadRef.current = load
  const hasFailedRef = useRef(false)
  const prevStatusRef = useRef(status)

  useEffect(() => {
    loadRef.current().catch(() => { hasFailedRef.current = true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const justReconnected = prevStatusRef.current !== 'online' && status === 'online'
    prevStatusRef.current = status
    if (justReconnected && hasFailedRef.current) {
      loadRef.current()
        .then(() => { hasFailedRef.current = false })
        .catch(() => { /* still down — stays failed, next reconnect will retry again */ })
    }
  }, [status])

  // Returns whether this specific attempt succeeded — a manual "Refresh"
  // action can use that to only show a success toast when it actually
  // worked.
  function retryNow() {
    return loadRef.current()
      .then(() => { hasFailedRef.current = false; return true })
      .catch(() => { hasFailedRef.current = true; return false })
  }

  return { retryNow }
}

export { useResilientLoad }
