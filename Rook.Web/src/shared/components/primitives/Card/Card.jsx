import { cn } from '@shared/utils/cn.js'
import './Card.css'

export function Card({ title, description, actions, children, className = '', danger = false }) {
  return (
    <section className={cn('card', danger && 'card--danger', className)}>
      {(title || actions) && (
        <header className="card__header">
          <div>
            {title && <h3 className="card__title">{title}</h3>}
            {description && <p className="card__description">{description}</p>}
          </div>
          {actions && <div className="card__actions">{actions}</div>}
        </header>
      )}
      <div className="card__body">{children}</div>
    </section>
  )
}

export function CardRow({ title, description, action }) {
  return (
    <div className="card-row">
      <div>
        <p className="card-row__title">{title}</p>
        {description && <p className="card-row__description">{description}</p>}
      </div>
      {action && <div className="card-row__action">{action}</div>}
    </div>
  )
}
