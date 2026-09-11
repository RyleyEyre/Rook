// .NET serializes an unset DateTime as its MinValue, "0001-01-01T00:00:00"
// — a real, parseable value, but not one that means anything to show a
// user. Treated the same as null/undefined: blank in the UI. The 1900
// cutoff is just a safe "obviously not a real record date" threshold, not
// a meaningful boundary in itself.
// The backend sends UTC timestamps *without* a timezone designator — e.g.
// "2026-09-08T14:30:00", no trailing 'Z' or +/-offset. `new Date(...)`
// treats a string with no timezone info as local time, not UTC, which is
// exactly backwards for what the backend means by it — that's the "an
// hour behind" bug. Appending 'Z' when nothing's already there forces the
// correct UTC parse; everything downstream (Intl.DateTimeFormat etc.)
// already converts to the browser's local timezone automatically once the
// Date object itself is correct, so that part never needed to change.
function toUtcDate(value) {
  if (!value) return null
  const hasTimezone = /Z$|[+-]\d{2}:?\d{2}$/.test(value)
  return new Date(hasTimezone ? value : `${value}Z`)
}

// .NET serializes an unset DateTime as its MinValue, "0001-01-01T00:00:00"
// — a real, parseable value, but not one that means anything to show a
// user. Treated the same as null/undefined: blank in the UI. The 1900
// cutoff is just a safe "obviously not a real record date" threshold, not
// a meaningful boundary in itself.
function isBlankDate(value) {
  const date = toUtcDate(value)
  return !date || Number.isNaN(date.getTime()) || date.getFullYear() < 1900
}

function formatDate(value, options = { dateStyle: 'medium' }) {
  if (isBlankDate(value)) return null
  return new Intl.DateTimeFormat(undefined, options).format(toUtcDate(value))
}

function formatDateTime(value) {
  return formatDate(value, { dateStyle: 'medium', timeStyle: 'short' })
}

// DD/MM/YY HH:mm:ss, 24-hour, with seconds — specifically for file
// exports (Excel/CSV), which want a plain, locale-unambiguous, sortable-
// looking value rather than the "Sep 9, 2026" style used on-screen.
// Built on toUtcDate() same as everything else here, so it still
// converts to the browser's local time correctly.
function formatDateForExport(value) {
  if (isBlankDate(value)) return ''
  const date = toUtcDate(value)
  const pad = (n) => String(n).padStart(2, '0')
  const day = pad(date.getDate())
  const month = pad(date.getMonth() + 1)
  const year = pad(date.getFullYear() % 100)
  const time = [date.getHours(), date.getMinutes(), date.getSeconds()].map(pad).join(':')
  return `${day}/${month}/${year} ${time}`
}

const RELATIVE_UNITS = [
  ['year', 31536000],
  ['month', 2592000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
]

function formatRelativeDate(value) {
  if (isBlankDate(value)) return null
  const seconds = (toUtcDate(value).getTime() - Date.now()) / 1000
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  for (const [unit, secondsInUnit] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= secondsInUnit) {
      return rtf.format(Math.round(seconds / secondsInUnit), unit)
    }
  }
  return rtf.format(Math.round(seconds), 'second')
}

// DataTable's default sort just string-compares row[column.key] — for a
// blank/unset date that would put it wherever "" (or "0001-...") happens
// to fall alphabetically, which isn't meaningful. This keeps unset dates
// grouped at the front consistently, for use as a column's `sortValue`.
function dateSortValue(value) {
  return isBlankDate(value) ? '' : value
}

export { isBlankDate, formatDate, formatDateTime, formatDateForExport, formatRelativeDate, dateSortValue, toUtcDate }
