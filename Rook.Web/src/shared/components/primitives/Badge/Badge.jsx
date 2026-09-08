import { cn } from '@shared/utils/cn.js'
import './Badge.css'

export function Badge({ tone = 'neutral', children, dot = false }) {
  return (
    <span className={cn('badge', `badge--${tone}`)}>
      {dot && <span className="badge__dot" />}
      {children}
    </span>
  )
}
