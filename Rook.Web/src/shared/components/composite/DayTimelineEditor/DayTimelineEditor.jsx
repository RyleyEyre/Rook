import { useCallback, useRef, useState } from 'react'
import { ToggleSwitch } from '@shared/components/composite/Field'
import { cn } from '@shared/utils/cn.js'
import './DayTimelineEditor.css'

const MINUTES_PER_DAY = 24 * 60
const SNAP_MINUTES = 30
const MIN_BLOCK_MINUTES = 30
const MAX_BLOCK_MINUTES = 12 * 60
const DEFAULT_BLOCK_MINUTES = 60
const HOUR_MARKS = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22]

function clockToMinutes(hhmmss) {
  const [h, m] = hhmmss.split(':').map(Number)
  return h * 60 + m
}

function minutesToClock(minutes) {
  const wrapped = ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY
  const h = Math.floor(wrapped / 60)
  const m = wrapped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
}

function formatClock(minutes, timeFormat) {
  const wrapped = ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY
  const h = Math.floor(wrapped / 60)
  const mm = String(wrapped % 60).padStart(2, '0')
  if (timeFormat === '24h') return `${String(h).padStart(2, '0')}:${mm}`
  const hour12 = ((h + 11) % 12) + 1
  return `${hour12}:${mm} ${h >= 12 ? 'PM' : 'AM'}`
}

// Axis minutes are a pure *display* coordinate — 0 is always the left
// edge of the track, 1440 the right edge. In day mode that's identical to
// clock minutes (0 = midnight). In night mode the axis is shifted by 12h
// so noon sits at the edges and midnight sits in the middle — which is
// what lets an overnight range be dragged as one unbroken block instead
// of two separate pieces at either end of the track. Toggling `night`
// never changes what a saved value *means*, only where it's drawn.
function axisFromClock(clockMinutes, night) {
  return night ? (clockMinutes - 720 + MINUTES_PER_DAY) % MINUTES_PER_DAY : clockMinutes
}
function clockFromAxis(axisMinutes, night) {
  return night ? (axisMinutes + 720) % MINUTES_PER_DAY : axisMinutes
}

function hourLabel(hour24, night) {
  const shifted = night ? (hour24 + 12) % 24 : hour24
  if (shifted === 0) return '12AM'
  if (shifted === 12) return '12PM'
  return shifted > 12 ? `${shifted - 12}PM` : `${shifted}AM`
}

function snap(minutes) {
  return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v))
}

/**
 * A single day's interactive 24-hour range picker. Drag on empty space to
 * create a block, drag its edges to resize, drag its body to move.
 * Deliberately enforces exactly one contiguous range (or none) — the API
 * only supports a single start/end per day, never multiple disjoint
 * blocks, so there's nothing to reconcile against that constraint later;
 * the interaction just never offers a way to create a second one.
 *
 * `value`/`onChange` are always in real clock time ({ startTime, endTime }
 * as "HH:mm:ss", or null for a day off) — the axis-space math above is
 * entirely internal to how this renders and reads drag gestures.
 */
export function DayTimelineEditor({ value, onChange, night, onNightChange, timeFormat = '12h' }) {
  const trackRef = useRef(null)
  const dragRef = useRef(null) // { mode, anchorAxis, startAxis?, endAxis? }
  const [draft, setDraft] = useState(null) // axis-space { start, end } while actively dragging
  const [isDragging, setIsDragging] = useState(false)

  const committedAxis = value
    ? { start: axisFromClock(clockToMinutes(value.startTime), night), end: axisFromClock(clockToMinutes(value.endTime), night) }
    : null
  // Guard against a mismatched `night` flag ever producing an inverted
  // range (only possible if a value is loaded in before `night` has been
  // set to match its actual overnight-ness) — render nothing rather than
  // a garbled block.
  const safeCommittedAxis = committedAxis && committedAxis.start < committedAxis.end ? committedAxis : null
  const current = draft ?? safeCommittedAxis

  function axisFromEvent(e) {
    const rect = trackRef.current.getBoundingClientRect()
    const fraction = clamp((e.clientX - rect.left) / rect.width, 0, 1)
    return clamp(snap(fraction * MINUTES_PER_DAY), 0, MINUTES_PER_DAY)
  }

  function commit(axisStart, axisEnd) {
    if (axisEnd - axisStart < MIN_BLOCK_MINUTES) return
    // Defensive clamp — every drag path below already keeps the range
    // within 12h, but this makes the rule hold regardless of how a value
    // ever reaches here (e.g. if this component is reused later to edit
    // an already-saved day).
    const clampedEnd = Math.min(axisEnd, axisStart + MAX_BLOCK_MINUTES)
    onChange({
      startTime: minutesToClock(clockFromAxis(axisStart, night)),
      endTime: minutesToClock(clockFromAxis(clampedEnd, night)),
    })
  }

  const handlePointerDown = useCallback((e, mode) => {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    const pos = axisFromEvent(e)
    setIsDragging(true)

    if (mode === 'create') {
      const start = pos
      const end = clamp(Math.max(pos + DEFAULT_BLOCK_MINUTES, pos + MIN_BLOCK_MINUTES), 0, Math.min(MINUTES_PER_DAY, start + MAX_BLOCK_MINUTES))
      dragRef.current = { mode: 'create', anchorAxis: start }
      setDraft({ start, end })
    } else if (mode === 'move') {
      dragRef.current = { mode: 'move', anchorAxis: pos, startAxis: current.start, endAxis: current.end }
      setDraft({ start: current.start, end: current.end })
    } else {
      dragRef.current = { mode, anchorAxis: mode === 'resize-start' ? current.end : current.start }
      setDraft({ start: current.start, end: current.end })
    }
  }, [current])

  function handlePointerMove(e) {
    const drag = dragRef.current
    if (!drag) return
    const pos = axisFromEvent(e)

    if (drag.mode === 'create') {
      const start = Math.min(drag.anchorAxis, pos)
      const rawEnd = Math.max(Math.max(drag.anchorAxis, pos), start + MIN_BLOCK_MINUTES)
      const end = Math.min(rawEnd, MINUTES_PER_DAY, start + MAX_BLOCK_MINUTES)
      setDraft({ start, end })
    } else if (drag.mode === 'move') {
      const delta = pos - drag.anchorAxis
      const width = drag.endAxis - drag.startAxis
      const start = clamp(drag.startAxis + delta, 0, MINUTES_PER_DAY - width)
      setDraft({ start, end: start + width })
    } else if (drag.mode === 'resize-start') {
      const end = drag.anchorAxis
      const start = clamp(pos, Math.max(0, end - MAX_BLOCK_MINUTES), end - MIN_BLOCK_MINUTES)
      setDraft({ start, end })
    } else if (drag.mode === 'resize-end') {
      const start = drag.anchorAxis
      const end = clamp(pos, start + MIN_BLOCK_MINUTES, Math.min(MINUTES_PER_DAY, start + MAX_BLOCK_MINUTES))
      setDraft({ start, end })
    }
  }

  function handlePointerUp() {
    setIsDragging(false)
    if (!dragRef.current || !draft) { dragRef.current = null; return }
    commit(draft.start, draft.end)
    dragRef.current = null
    setDraft(null)
  }

  function handleHandleKeyDown(e, which) {
    if (!current || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return
    e.preventDefault()
    const delta = (e.key === 'ArrowRight' ? 1 : -1) * SNAP_MINUTES
    if (which === 'start') {
      commit(clamp(current.start + delta, Math.max(0, current.end - MAX_BLOCK_MINUTES), current.end - MIN_BLOCK_MINUTES), current.end)
    } else {
      commit(current.start, clamp(current.end + delta, current.start + MIN_BLOCK_MINUTES, Math.min(MINUTES_PER_DAY, current.start + MAX_BLOCK_MINUTES)))
    }
  }

  const leftPct = current ? (current.start / MINUTES_PER_DAY) * 100 : 0
  const widthPct = current ? ((current.end - current.start) / MINUTES_PER_DAY) * 100 : 0

  return (
    <div className="day-timeline">
      <div className="day-timeline__toolbar">
        <ToggleSwitch label="Overnight (shifts the view)" checked={night} onChange={onNightChange} />
        <div className="day-timeline__toolbar-right">
          <span className="day-timeline__max-hint">Max 12h per day</span>
          {value && (
            <button type="button" className="day-timeline__clear" onClick={() => onChange(null)}>
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="day-timeline__hours" aria-hidden="true">
        {HOUR_MARKS.map((h) => (
          <span key={h} style={{ left: `${(h / 24) * 100}%` }}>{hourLabel(h, night)}</span>
        ))}
      </div>

      <div
        ref={trackRef}
        className={cn('day-timeline__track', !current && 'is-empty')}
        onPointerDown={(e) => { if (!current) handlePointerDown(e, 'create') }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        role="group"
        aria-label={night ? 'Working hours, night view (noon to noon)' : 'Working hours'}
      >
        {Array.from({ length: 48 }).map((_, i) => (
          <span key={i} className={cn('day-timeline__tick', i % 4 === 0 && 'day-timeline__tick--hour')} style={{ left: `${(i / 48) * 100}%` }} />
        ))}

        {current && (
          <div
            className={cn('day-timeline__block', isDragging && 'is-dragging')}
            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
            onPointerDown={(e) => handlePointerDown(e, 'move')}
          >
            <button
              type="button"
              className="day-timeline__handle day-timeline__handle--start"
              onPointerDown={(e) => handlePointerDown(e, 'resize-start')}
              onKeyDown={(e) => handleHandleKeyDown(e, 'start')}
              aria-label="Adjust start time"
            />
            <button
              type="button"
              className="day-timeline__handle day-timeline__handle--end"
              onPointerDown={(e) => handlePointerDown(e, 'resize-end')}
              onKeyDown={(e) => handleHandleKeyDown(e, 'end')}
              aria-label="Adjust end time"
            />
          </div>
        )}
      </div>

      {/* Kept off the block itself rather than centred inside it — a short
          block (the minimum is 30 minutes) doesn't have room for the text,
          and it would either overflow onto the track's own background or
          get clipped. It also needs to stay readable regardless of the
          accent colour, which the block's own on-accent text colour isn't
          guaranteed to be once it's sitting outside the block rather than
          on top of it. */}
      <p className="day-timeline__current-label">
        {current
          ? <>{formatClock(clockFromAxis(current.start, night), timeFormat)}{'\u2013'}{formatClock(clockFromAxis(current.end, night), timeFormat)}</>
          : 'No hours set for this day'}
      </p>
    </div>
  )
}
