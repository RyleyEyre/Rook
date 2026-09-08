import './ProgressBar.css'

export function ProgressBar({ value = 0, label }) {
  return (
    <div className="progress">
      {label && <div className="progress__label">{label}</div>}
      <div className="progress__track">
        <div className="progress__fill" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
