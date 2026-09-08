import { cn } from '@shared/utils/cn.js'
import { Icon } from '@shared/components/primitives/Icon'
import './Button.css'

export function Button({
  children,
  variant = 'primary', // primary | secondary | ghost | danger
  size = 'md', // sm | md | lg
  loading = false,
  disabled = false,
  icon,
  type = 'button',
  className = '',
  ...rest
}) {
  return (
    <button
      type={type}
      className={cn('btn', `btn--${variant}`, `btn--${size}`, loading && 'is-loading', className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Icon name="spinner" size={16} className="btn__spinner" />}
      {!loading && icon && <Icon name={icon} size={16} />}
      <span>{children}</span>
    </button>
  )
}

export function IconButton({ icon, label, variant = 'ghost', size = 16, className = '', ...rest }) {
  return (
    <button
      type="button"
      className={cn('icon-btn', `icon-btn--${variant}`, className)}
      aria-label={label}
      title={label}
      {...rest}
    >
      <Icon name={icon} size={size} />
    </button>
  )
}
