import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@shared/utils/cn.js'
import { Icon } from '@shared/components/primitives/Icon'
import './HoldToConfirmButton.css'

// How long the "done" checkmark/label shows before the button resets and
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
 */
function useHoldProgress(holdMs, onConfirm, disabled) {
  const [progress, setProgress] = useState(0)
  const [state, setState] = useState('idle') // idle | holding | done
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
    setState((s) => (s === 'done' ? 'done' : 'idle'))
  }, [])

  const tick = useCallback(() => {
    const elapsed = performance.now() - startRef.current
    const pct = Math.min(100, (elapsed / holdMs) * 100)
    setProgress(pct)
    if (pct >= 100) {
      setState('done')
      rafRef.current = null
      onConfirm?.()
      resetTimerRef.current = setTimeout(() => {
        setState('idle')
        setProgress(0)
      }, DONE_DISPLAY_MS)
      return
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [holdMs, onConfirm])

  const start = useCallback((e) => {
    if (disabled || state === 'done') return
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
  label, holdingLabel = 'Keep holding…', doneLabel = 'Removed', onConfirm, disabled, holdMs = 2000, size = 'md',
}) {
  const { progress, state, handlers } = useHoldProgress(holdMs, onConfirm, disabled)

  return (
    <button
      type="button"
      className={cn('hold-btn', size === 'sm' && 'hold-btn--sm', state === 'holding' && 'is-holding', state === 'done' && 'is-done')}
      disabled={disabled}
      {...handlers}
    >
      <span className="hold-btn__fill" style={{ width: `${progress}%` }} />
      <span className="hold-btn__label">
        {state === 'done' ? <Icon name="check" size={size === 'sm' ? 14 : 16} /> : <Icon name="trash" size={size === 'sm' ? 14 : 16} />}
        {state === 'done' ? doneLabel : state === 'holding' ? holdingLabel : label}
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

  return (
    <button
      type="button"
      className={cn('hold-icon-btn', state === 'holding' && 'is-holding', state === 'done' && 'is-done')}
      aria-label={label}
      title={label}
      disabled={disabled}
      {...handlers}
    >
      <span className="hold-icon-btn__fill" style={{ width: `${progress}%` }} />
      <Icon name={state === 'done' ? 'check' : icon} size={15} className="hold-icon-btn__icon" />
    </button>
  )
}
