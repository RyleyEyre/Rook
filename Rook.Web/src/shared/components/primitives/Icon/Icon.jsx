import './Icon.css'

export function RookIcon({ size = 20, color = 'currentColor', className }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color} className={className} aria-hidden="true">
      <rect x="5" y="3" width="3" height="3" />
      <rect x="10.5" y="3" width="3" height="3" />
      <rect x="16" y="3" width="3" height="3" />
      <rect x="5" y="6" width="14" height="3" />
      <polygon points="8,9 16,9 18,17 6,17" />
      <rect x="4" y="17" width="16" height="3" rx="1" />
    </svg>
  )
}

const paths = {
  search: 'M11 4a7 7 0 1 0 4.2 12.6l4.6 4.6 1.4-1.4-4.6-4.6A7 7 0 0 0 11 4Zm-5 7a5 5 0 1 1 10 0 5 5 0 0 1-10 0Z',
  sortUp: 'M7 14l5-5 5 5H7Z',
  sortDown: 'M7 10l5 5 5-5H7Z',
  sortBoth: 'M7 9l5-5 5 5H7Zm0 6l5 5 5-5H7Z',
  edit: 'M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Zm12.5-14.5 3 3',
  sun: 'M12 4V2m0 20v-2m8-8h2M2 12h2m13.66-6.66 1.42-1.42M4.92 19.08l1.42-1.42M19.08 19.08l-1.42-1.42M4.92 4.92 6.34 6.34M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z',
  moon: 'M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z',
  check: 'M5 13l4 4L19 7',
  x: 'M6 6l12 12M18 6 6 18',
  chevronDown: 'M6 9l6 6 6-6',
  chevronRight: 'M9 6l6 6-6 6',
  warning: 'M12 3 2 20h20L12 3Zm0 6v5m0 3h.01',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 8v5m0-8h.01',
  spinner: 'M12 3a9 9 0 1 0 9 9',
  plus: 'M12 5v14M5 12h14',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 9a8 8 0 0 1 16 0',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Zm10 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z',
  eyeOff: 'M3 3l18 18M10.6 10.6a3.5 3.5 0 0 0 4.8 4.8M6.5 6.7C4 8.3 2 12 2 12s3.5 7 10 7c1.6 0 3-.3 4.2-.9M9.9 5.2C10.6 5.1 11.3 5 12 5c6.5 0 10 7 10 7-.4.7-1.1 1.7-2 2.7',
  filter: 'M4 5h16l-6 8v6l-4 2v-8L4 5Z',
  dots: 'M5 12h.01M12 12h.01M19 12h.01',
  bell: 'M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Zm4 9a2 2 0 0 0 4 0',
  lock: 'M6 11V8a6 6 0 1 1 12 0v3m-13 0h14v9H5v-9Z',
  refresh: 'M4 4v6h6M20 20v-6h-6M4.5 15a8 8 0 0 0 14.8 2.5M19.5 9A8 8 0 0 0 4.7 6.5',
  grid: 'M3 3h8v8H3ZM14 3h8v8h-8ZM3 14h8v8H3ZM14 14h8v8h-8Z',
  folder: 'M3 6a1 1 0 0 1 1-1h5.5l1.5 2H20a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6Z',
  clock: 'M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0ZM12 7v5l3.5 2',
}

// The trash can is split into a lid (rim + handle) and a body so the two
// can animate independently — the lid pops off and lands back on while the
// whole can gives a small hop, rather than one aggressive whole-icon shake.
const trashLidPath = 'M6 7h12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2'
const trashBodyPath = 'M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13'

// The settings gear is built from primitive shapes rather than one path so
// the teeth stay crisp at small sizes; six evenly-spaced teeth rotated
// around the center, a ring, and a solid hub.
const GEAR_TEETH_DEGREES = [0, 60, 120, 180, 240, 300]

// What each icon does when its interactive ancestor (a button, a sortable
// column header, a dismiss control, ...) is hovered or keyboard-focused.
// See styles/global-icon-triggers.css for the actual keyframes and the list
// of ancestor selectors that trigger them.
const hoverAnimations = {
  // 'trash' is handled separately below — it animates as a lid + body pair.
  edit: 'wiggle',
  refresh: 'spin-once',
  check: 'pop',
  x: 'pop-rotate',
  plus: 'pop-rotate',
  chevronDown: 'nudge-down',
  chevronRight: 'nudge-right',
  sortUp: 'nudge-up',
  sortDown: 'nudge-down',
  sortBoth: 'nudge-y',
  warning: 'buzz',
  bell: 'ring',
  lock: 'jiggle',
  filter: 'tilt',
  dots: 'bounce',
  eye: 'blink',
  eyeOff: 'blink',
  sun: 'spin-slow',
  moon: 'spin-slow',
  info: 'pulse',
  search: 'zoom',
  user: 'pulse',
  grid: 'pop',
  folder: 'wiggle',
  clock: 'ring',
  // 'gear' is handled separately below — it spins as a whole on hover.
  // spinner already spins continuously via .btn__spinner while loading —
  // giving it a second hover animation would just look broken.
}

// Every class Icon renders is intentionally global and `rk-` prefixed —
// this is Icon's own naming convention (it was never a CSS module, even
// before the app-wide move to plain CSS), since styles/global-icon-triggers.css
// matches these classes from a completely separate file to decide which
// hover state plays which animation.
export function Icon({ name, size = 18, className, ...rest }) {
  if (name === 'trash') {
    const classes = ['rk-icon', 'rk-icon--trash', 'rk-icon-anim--trash-hop', className].filter(Boolean).join(' ')
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className={classes}
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...rest}
      >
        <path className="rk-icon-trash-body" d={trashBodyPath} />
        <path className="rk-icon-trash-lid" d={trashLidPath} />
      </svg>
    )
  }

  if (name === 'gear') {
    const classes = ['rk-icon', 'rk-icon--gear', 'rk-icon-anim--spin-slow', className].filter(Boolean).join(' ')
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} className={classes} aria-hidden="true" {...rest}>
        {GEAR_TEETH_DEGREES.map((deg) => (
          <rect key={deg} x="10.5" y="1.3" width="3" height="4" rx="1" fill="currentColor" transform={`rotate(${deg} 12 12)`} />
        ))}
        <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="2.6" fill="currentColor" />
      </svg>
    )
  }

  const d = paths[name]
  if (!d) return null
  const isStroke = ['sortUp', 'sortDown', 'sortBoth', 'check', 'x', 'chevronDown', 'chevronRight',
    'warning', 'info', 'spinner', 'plus', 'eye', 'eyeOff', 'filter', 'dots', 'bell', 'lock', 'refresh', 'clock'].includes(name)
  const anim = hoverAnimations[name]
  const classes = ['rk-icon', `rk-icon--${name}`, anim && `rk-icon-anim--${anim}`, className].filter(Boolean).join(' ')
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={classes}
      aria-hidden="true"
      fill={isStroke ? 'none' : 'currentColor'}
      stroke={isStroke ? 'currentColor' : 'none'}
      strokeWidth={isStroke ? 2 : 0}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <path d={d} />
    </svg>
  )
}
