import { useState } from 'react'
import './Tooltip.css'

export function Tooltip({ label, children }) {
  const [show, setShow] = useState(false)
  return (
    <span
      className="tooltip-wrap"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && <span className="tooltip" role="tooltip">{label}</span>}
    </span>
  )
}
