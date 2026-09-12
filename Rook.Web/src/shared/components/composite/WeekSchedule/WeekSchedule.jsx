import { Icon } from '@shared/components/primitives/Icon'
import { Tooltip } from '@shared/components/primitives/Tooltip'
import { cn } from '@shared/utils/cn.js'
import './WeekSchedule.css'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_LABELS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MINUTES_PER_DAY = 24 * 60

function toMinutes(hhmmss) {
  const [h, m] = hhmmss.split(':').map(Number)
  return h * 60 + m
}

function formatTime(hhmmss, timeFormat) {
  const [h, m] = hhmmss.split(':').map(Number)
  const mm = String(m).padStart(2, '0')
  if (timeFormat === '24h') return `${String(h).padStart(2, '0')}:${mm}`
  const hour12 = ((h + 11) % 12) + 1
  const suffix = h >= 12 ? 'PM' : 'AM'
  return `${hour12}:${mm} ${suffix}`
}

function isOvernight(entry) {
  return toMinutes(entry.endTime) <= toMinutes(entry.startTime)
}

function pct(minutes) {
  return (minutes / MINUTES_PER_DAY) * 100
}

// Renders a time range in *both* formats, wrapped in mutually-exclusive
// spans — which one actually shows is a pure CSS decision (see
// WeekSchedule.css): the user's chosen `timeFormat` by default, but
// forced to the shorter 24h form once the container gets too narrow for
// the AM/PM version to sit comfortably, regardless of that preference.
function TimeRange({ start, end }) {
  return (
    <>
      <span className="week-schedule__fmt-12h">{formatTime(start, '12h')}{'\u2013'}{formatTime(end, '12h')}</span>
      <span className="week-schedule__fmt-24h">{formatTime(start, '24h')}{'\u2013'}{formatTime(end, '24h')}</span>
    </>
  )
}

/**
 * Pure display component: given a shift pattern's `days` array (the exact
 * shape the API returns/expects — { dayOfWeek: 0-6, startTime, endTime }
 * in HH:mm:ss), renders a Sun–Sat row of mini 24-hour timeline bars.
 *
 * Deliberately has no editing behaviour and no knowledge of shift
 * patterns specifically — it just draws a week of time-blocks from
 * `days`. That's intentional: this is meant to be reusable later for
 * anything else that's "a week of time ranges" (an employee's assigned
 * shift, a one-off schedule override, etc.), with any editing UI built as
 * a separate layer on top rather than baked in here.
 *
 * Overnight handling: the API attributes an overnight shift (endTime <=
 * startTime) entirely to the day it starts — there's no second entry on
 * the following day. So a night shift would otherwise just look like it
 * "runs off the edge and vanishes" on its start day, with nothing to
 * explain where it went. To make that legible, the start day's bar fills
 * to midnight and gets a small arrow marker on its trailing edge; the
 * *following* day's bar gets a hatched "carried over" segment from
 * midnight to the entry's endTime, even though that day has no `days`
 * entry of its own. If that next day *also* has its own real shift, both
 * segments render together (a genuinely separate day shift plus the
 * carry-over from the previous night).
 */
export function WeekSchedule({ days = [], timeFormat = '12h', className = '' }) {
  const byDay = new Map(days.map((d) => [d.dayOfWeek, d]))

  return (
    <div className={cn('week-schedule-container', className)}>
      <div className="week-schedule" data-preferred-format={timeFormat}>
        {DAY_LABELS.map((label, dayOfWeek) => {
          const entry = byDay.get(dayOfWeek)
          const prevEntry = byDay.get((dayOfWeek + 6) % 7)
          const carryOver = prevEntry && isOvernight(prevEntry) ? prevEntry : null
          const overnight = entry && isOvernight(entry)
          const off = !entry && !carryOver

          return (
            <div key={dayOfWeek} className={cn('week-schedule__day', off && 'is-off')}>
              <span className="week-schedule__label">{label}</span>

              <div className="week-schedule__bar" aria-hidden="true">
                <span className="week-schedule__tick" style={{ left: '25%' }} />
                <span className="week-schedule__tick week-schedule__tick--mid" style={{ left: '50%' }} />
                <span className="week-schedule__tick" style={{ left: '75%' }} />

                {carryOver && (
                  <span
                    className="week-schedule__segment week-schedule__segment--carry"
                    style={{ left: 0, width: `${pct(toMinutes(carryOver.endTime))}%` }}
                  >
                    <Icon name="chevronRight" size={11} className="week-schedule__carry-arrow" />
                  </span>
                )}

                {entry && (
                  <span
                    className={cn('week-schedule__segment', overnight && 'week-schedule__segment--overnight')}
                    style={{
                      left: `${pct(toMinutes(entry.startTime))}%`,
                      width: `${pct((overnight ? MINUTES_PER_DAY : toMinutes(entry.endTime)) - toMinutes(entry.startTime))}%`,
                    }}
                  >
                    {overnight && <Icon name="chevronRight" size={11} className="week-schedule__overnight-arrow" />}
                  </span>
                )}
              </div>

              <span className="week-schedule__time">
                {entry ? (
                  overnight ? (
                    <Tooltip label={`${formatTime(entry.startTime, timeFormat)} ${DAY_LABELS_FULL[dayOfWeek]} \u2192 ${formatTime(entry.endTime, timeFormat)} ${DAY_LABELS_FULL[(dayOfWeek + 1) % 7]}`}>
                      <span className="week-schedule__range">
                        <TimeRange start={entry.startTime} end={entry.endTime} /> <span className="week-schedule__plus1">+1</span>
                      </span>
                    </Tooltip>
                  ) : (
                    <span className="week-schedule__range">
                      <TimeRange start={entry.startTime} end={entry.endTime} />
                    </span>
                  )
                ) : carryOver ? (
                  <Tooltip label={`Continues from ${DAY_LABELS_FULL[(dayOfWeek + 6) % 7]} night, until ${formatTime(carryOver.endTime, timeFormat)}`}>
                    <span className="week-schedule__carry-label">
                      until <span className="week-schedule__fmt-12h">{formatTime(carryOver.endTime, '12h')}</span><span className="week-schedule__fmt-24h">{formatTime(carryOver.endTime, '24h')}</span>
                    </span>
                  </Tooltip>
                ) : (
                  <span className="week-schedule__off-label">Off</span>
                )}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
