import { useState } from 'react'
import { cn } from '@shared/utils/cn.js'
import { Icon } from '@shared/components/primitives/Icon'
import './Banner.css'

export function Banner({ tone = 'info', title, children, dismissible = false, onDismiss }) {
  const [visible, setVisible] = useState(true)
  if (!visible) return null
  return (
    <div className={cn('banner', `banner--${tone}`)} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon name={icons[tone]} size={18} className="banner__icon" />
      <div className="banner__body">
        {title && <strong>{title}</strong>}
        {children && <div>{children}</div>}
      </div>
      {dismissible && (
        <button
          className="banner__close"
          aria-label="Dismiss"
          onClick={() => { setVisible(false); onDismiss?.() }}
        >
          <Icon name="x" size={14} />
        </button>
      )}
    </div>
  )
}

const icons = { info: 'info', success: 'check', warning: 'warning', error: 'warning' }
