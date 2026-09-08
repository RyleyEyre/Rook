import { useEffect } from 'react'
import { cn } from '@shared/utils/cn.js'
import { Icon } from '@shared/components/primitives/Icon'
import './Modal.css'

export function Modal({ open, onClose, title, children, footer, tone = 'default' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.() }}>
      <div className={cn('modal', tone === 'danger' && 'modal--danger')} role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal__header">
          <h2>{title}</h2>
          <button className="modal__close" aria-label="Close" onClick={onClose}>
            <Icon name="x" size={16} />
          </button>
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__footer">{footer}</footer>}
      </div>
    </div>
  )
}
