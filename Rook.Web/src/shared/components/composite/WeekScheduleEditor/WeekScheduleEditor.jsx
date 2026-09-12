import { useState } from 'react'
import { Icon } from '@shared/components/primitives/Icon'
import { DayTimelineEditor } from '@shared/components/composite/DayTimelineEditor'
import { cn } from '@shared/utils/cn.js'
import './WeekScheduleEditor.css'

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function toMinutes(hhmmss) {
  const [h, m] = hhmmss.split(':').map(Number)
  return h * 60 + m
}

function isOvernight(entry) {
  return toMinutes(entry.endTime) <= toMinutes(entry.startTime)
}

function formatSummary(entry, timeFormat) {
  if (!entry) return 'Off'
  const fmt = (hhmmss) => {
    const [h, m] = hhmmss.split(':').map(Number)
    const mm = String(m).padStart(2, '0')
    if (timeFormat === '24h') return `${String(h).padStart(2, '0')}:${mm}`
    const hour12 = ((h + 11) % 12) + 1
    return `${hour12}:${mm} ${h >= 12 ? 'PM' : 'AM'}`
  }
  return `${fmt(entry.startTime)}\u2013${fmt(entry.endTime)}${isOvernight(entry) ? ' +1' : ''}`
}

/**
 * Edits a full shift pattern's `days` array — a Sun–Sat accordion, one day
 * open at a time, each backed by a DayTimelineEditor. Fully controlled:
 * `days` in, `onChange(nextDays)` out, same shape the API expects
 * ([{ dayOfWeek, startTime, endTime }], one entry per working day, absent
 * = off) — nothing here is shift-pattern-specific, so this is meant to be
 * reusable for anything else that's "edit a week of time ranges" later
 * (an employee's own assigned schedule, etc.), same reasoning as
 * WeekSchedule (the read-only display half of this).
 *
 * Each day tracks its own "night view" locally rather than in `days` —
 * it's a pure display choice (see DayTimelineEditor), not part of the
 * saved shape, so there's nothing to persist or submit for it. It
 * defaults to whatever matches the day's current value (on if that day
 * is already an overnight entry), so this stays correct if this
 * component is ever reused to *edit* an existing pattern rather than
 * only build a new one from blank.
 */
export function WeekScheduleEditor({ days, onChange, timeFormat = '12h' }) {
  const [openDay, setOpenDay] = useState(null)
  const [nightByDay, setNightByDay] = useState(() => {
    const initial = {}
    for (const d of days) initial[d.dayOfWeek] = isOvernight(d)
    return initial
  })

  const byDay = new Map(days.map((d) => [d.dayOfWeek, d]))

  function updateDay(dayOfWeek, nextEntry) {
    const withoutDay = days.filter((d) => d.dayOfWeek !== dayOfWeek)
    const next = nextEntry ? [...withoutDay, { dayOfWeek, ...nextEntry }] : withoutDay
    next.sort((a, b) => a.dayOfWeek - b.dayOfWeek)
    onChange(next)
  }

  return (
    <div className="week-schedule-editor">
      {DAY_LABELS.map((label, dayOfWeek) => {
        const entry = byDay.get(dayOfWeek) ?? null
        const open = openDay === dayOfWeek
        const night = nightByDay[dayOfWeek] ?? false

        return (
          <div key={dayOfWeek} className={cn('week-schedule-editor__day', open && 'is-open')}>
            <button
              type="button"
              className="week-schedule-editor__header"
              onClick={() => setOpenDay(open ? null : dayOfWeek)}
              aria-expanded={open}
            >
              <span className="week-schedule-editor__day-name">{label}</span>
              <span className={cn('week-schedule-editor__summary', !entry && 'is-off')}>{formatSummary(entry, timeFormat)}</span>
              <Icon name="chevronDown" size={16} className="week-schedule-editor__chevron" />
            </button>

            {open && (
              <div className="week-schedule-editor__body">
                <DayTimelineEditor
                  value={entry}
                  onChange={(next) => updateDay(dayOfWeek, next)}
                  night={night}
                  onNightChange={(v) => setNightByDay((prev) => ({ ...prev, [dayOfWeek]: v }))}
                  timeFormat={timeFormat}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
