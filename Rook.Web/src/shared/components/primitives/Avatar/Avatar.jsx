import './Avatar.css'

export function Avatar({ name, size = 32 }) {
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {initials}
    </span>
  )
}
