import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@shared/utils/cn.js'
import { Icon } from '@shared/components/primitives/Icon'
import './HoldToConfirmButton.css'

// How long the "done"/"failed" label shows before the button resets and
// becomes usable again.
const DONE_DISPLAY_MS = 1200

/**
 * Shared press-and-hold mechanic: the fill sweeps over `holdMs` and only
 * fires onConfirm if the user holds for the full duration. Releasing early
 * cancels and the fill snaps back — makes accidental destructive clicks
 * (misclicks, fast double-taps) much harder to trigger. Used by both the
 * full-width HoldToConfirmButton and the compact HoldToConfirmIconButton
 * below so the two stay visually/behaviorally in sync.
 *
 * After firing, the button shows "done" briefly and then resets to idle on
 * its own — it doesn't rely on the caller unmounting it (e.g. by removing
 * the deleted row). A button that survives its own action, like a bulk
 * toolbar's Delete after clearing the selection, needs to be usable again
 * for the next one; getting stuck on the checkmark forever was a bug, not
 * a feature.
 *
 * `onConfirm` can return a promise — completing the hold now genuinely
 * *awaits* it before showing success, rather than assuming success the
 * instant the hold finishes. That distinction matters for exactly what it
 * sounds like: a delete that the server rejects (still in use, a network
 * blip, whatever) used to play the same green checkmark as a delete that
 * actually worked, because the button had no way to know the difference —
 * it only knew the *hold* completed, not that the actual action did. A
 * plain non-promise return (or no return at all) is treated as immediate
 * success, so this is fully backward-compatible with any caller that
 * hasn't been updated to signal failure.
 */
function useHoldProgress(holdMs, onConfirm, disabled) {
  const [progress, setProgress] = useState(0)
  const [state, setState] = useState('idle') // idle | holding | confirming | done | failed
  const rafRef = useRef(null)
  const startRef = useRef(0)
  const resetTimerRef = useRef(null)

  useEffect(() => () => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
  }, [])

  const cancel = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    setProgress(0)
    // A pointerup right as the hold completes shouldn't snap a settled
    // outcome (or the in-flight wait for one) back to idle.
    setState((s) => (s === 'done' || s === 'failed' || s === 'confirming' ? s : 'idle'))
  }, [])

  const tick = useCallback(() => {
    const elapsed = performance.now() - startRef.current
    const pct = Math.min(100, (elapsed / holdMs) * 100)
    setProgress(pct)
    if (pct >= 100) {
      rafRef.current = null
      setState('confirming')
      // An async IIFE + try/catch here rather than
      // Promise.resolve(onConfirm()).catch(...) — that pattern only
      // catches onConfirm *rejecting*, not onConfirm *throwing
      // synchronously*, since onConfirm() would already have thrown by
      // the time Promise.resolve() got a chance to wrap anything. Being
      // inside an async function normalizes both into the same catch.
      ;(async () => {
        try {
          await onConfirm?.()
          setState('done')
          resetTimerRef.current = setTimeout(() => {
            setState('idle')
            setProgress(0)
          }, DONE_DISPLAY_MS)
        } catch {
          setState('failed')
          resetTimerRef.current = setTimeout(() => {
            setState('idle')
            setProgress(0)
          }, DONE_DISPLAY_MS)
        }
      })()
      return
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [holdMs, onConfirm])

  const start = useCallback((e) => {
    if (disabled || state === 'done' || state === 'confirming' || state === 'failed') return
    e.preventDefault()
    setState('holding')
    startRef.current = performance.now()
    rafRef.current = requestAnimationFrame(tick)
  }, [disabled, state, tick])

  return {
    progress,
    state,
    handlers: {
      onPointerDown: start,
      onPointerUp: cancel,
      onPointerLeave: cancel,
      onContextMenu: (e) => e.preventDefault(),
    },
  }
}

export function HoldToConfirmButton({
  label, holdingLabel = 'Keep holding…', confirmingLabel = 'Confirming…', doneLabel = 'Removed', failedLabel = "Couldn't delete",
  onConfirm, disabled, holdMs = 2000, size = 'md',
}) {
  const { progress, state, handlers } = useHoldProgress(holdMs, onConfirm, disabled)
  const iconSize = size === 'sm' ? 14 : 16

  const icon = state === 'done' ? 'check' : state === 'failed' ? 'x' : state === 'confirming' ? 'spinner' : 'trash'
  const text = state === 'done' ? doneLabel : state === 'failed' ? failedLabel : state === 'confirming' ? confirmingLabel : state === 'holding' ? holdingLabel : label

  return (
    <button
      type="button"
      className={cn(
        'hold-btn', size === 'sm' && 'hold-btn--sm',
        state === 'holding' && 'is-holding', state === 'confirming' && 'is-confirming',
        state === 'done' && 'is-done', state === 'failed' && 'is-failed',
      )}
      disabled={disabled}
      {...handlers}
    >
      <span className="hold-btn__fill" style={{ width: `${progress}%` }} />
      <span className="hold-btn__label">
        <Icon name={icon} size={iconSize} />
        {text}
      </span>
    </button>
  )
}

/**
 * Icon-only version for tight spaces (table row actions, toolbars) — same
 * hold-and-fill mechanic, no label text. `holdMs` of 0 isn't handled
 * specially here; callers that want an instant (no-hold) delete should
 * render a plain IconButton instead — see DataTable's deleteConfirmSeconds.
 */
export function HoldToConfirmIconButton({ icon = 'trash', label, onConfirm, disabled, holdMs = 2000 }) {
  const { progress, state, handlers } = useHoldProgress(holdMs, onConfirm, disabled)
  const shownIcon = state === 'done' ? 'check' : state === 'failed' ? 'x' : state === 'confirming' ? 'spinner' : icon

  return (
    <button
      type="button"
      className={cn(
        'hold-icon-btn',
        state === 'holding' && 'is-holding', state === 'confirming' && 'is-confirming',
        state === 'done' && 'is-done', state === 'failed' && 'is-failed',
      )}
      aria-label={label}
      title={label}
      disabled={disabled}
      {...handlers}
    >
      <span className="hold-icon-btn__fill" style={{ width: `${progress}%` }} />
      <Icon name={shownIcon} size={15} className="hold-icon-btn__icon" />
    </button>
  )
}
