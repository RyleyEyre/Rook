import { useEffect, useRef } from 'react'
import { useHealthContext } from '@app/providers/HealthProvider.jsx'
import { useLogout } from './useLogout.js'
import { useToast } from '@app/providers/ToastProvider.jsx'

const GIVE_UP_AFTER_MS = 60000

// Meant to be called exactly once, from somewhere that's mounted for the
// whole authenticated session — App.jsx, not any individual page — since
// the entire point is that switching pages must never reset this clock.
// It's all one backend: if the connection's down, it's down regardless of
// which page happens to be on screen, so the "how long has it been down"
// state has to live somewhere that outlives page navigation too.
//
// Driven by HealthProvider's plain, unauthenticated /health poll — the
// single shared source of truth for "is the backend actually reachable",
// used here and in useResilientLoad rather than each asking the question
// its own way.
function useConnectivityWatchdog() {
  const { status } = useHealthContext()
  const logout = useLogout()
  const { push } = useToast()
  const disconnectedSinceRef = useRef(null)
  const gaveUpRef = useRef(false)

  useEffect(() => {
    // 'idle' means not authenticated / nothing to check — nothing to
    // watch (also what status becomes right after this watchdog's own
    // logout call, which is what stops it from re-triggering itself).
    if (status === 'online' || status === 'idle') {
      disconnectedSinceRef.current = null
      return
    }

    if (!disconnectedSinceRef.current) disconnectedSinceRef.current = Date.now()
    const remaining = GIVE_UP_AFTER_MS - (Date.now() - disconnectedSinceRef.current)

    const timer = setTimeout(() => {
      if (gaveUpRef.current) return
      gaveUpRef.current = true
      logout().then(() => {
        push({
          tone: 'error',
          title: 'Signed out',
          message: "We couldn't reach the server for over a minute, so you were signed out.",
        })
      })
    }, Math.max(0, remaining))

    return () => clearTimeout(timer)
  }, [status, logout, push])
}

export { useConnectivityWatchdog }
