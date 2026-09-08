import './Skeleton.css'

export function Skeleton({ width = '100%', height = 14 }) {
  return <span className="skeleton" style={{ width, height }} />
}
