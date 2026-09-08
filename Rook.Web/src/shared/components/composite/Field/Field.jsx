import { useId, useState } from 'react'
import { cn } from '@shared/utils/cn.js'
import { Icon } from '@shared/components/primitives/Icon'
import './Field.css'

export function TextInput({
  label, hint, error, type = 'text', icon, required, className = '', ...rest
}) {
  const id = useId()
  const [revealed, setRevealed] = useState(false)
  const isPassword = type === 'password'
  const resolvedType = isPassword && revealed ? 'text' : type

  return (
    <div className={cn('field', error && 'has-error', className)}>
      {label && (
        <label htmlFor={id} className="field__label">
          {label} {required && <span className="field__required">*</span>}
        </label>
      )}
      <div className="field__control">
        {icon && <Icon name={icon} size={16} className="field__icon" />}
        <input id={id} type={resolvedType} className="field__input" aria-invalid={Boolean(error)} required={required} {...rest} />
        {isPassword && (
          <button
            type="button"
            className="field__reveal"
            onClick={() => setRevealed((r) => !r)}
            aria-label={revealed ? 'Hide password' : 'Show password'}
          >
            <Icon name={revealed ? 'eyeOff' : 'eye'} size={16} />
          </button>
        )}
      </div>
      {error ? (
        <p className="field__error"><Icon name="warning" size={13} /> {error}</p>
      ) : hint ? (
        <p className="field__hint">{hint}</p>
      ) : null}
    </div>
  )
}

export function Textarea({ label, hint, error, className = '', ...rest }) {
  const id = useId()
  return (
    <div className={cn('field', error && 'has-error', className)}>
      {label && <label htmlFor={id} className="field__label">{label}</label>}
      <textarea id={id} className="field__input field__input--textarea" aria-invalid={Boolean(error)} {...rest} />
      {error ? (
        <p className="field__error"><Icon name="warning" size={13} /> {error}</p>
      ) : hint ? (
        <p className="field__hint">{hint}</p>
      ) : null}
    </div>
  )
}

export function Select({ label, hint, error, children, className = '', ...rest }) {
  const id = useId()
  return (
    <div className={cn('field', error && 'has-error', className)}>
      {label && <label htmlFor={id} className="field__label">{label}</label>}
      <div className="field__control field__control--select">
        <select id={id} className="field__input" aria-invalid={Boolean(error)} {...rest}>
          {children}
        </select>
        <Icon name="chevronDown" size={15} className="field__chevron" />
      </div>
      {error ? (
        <p className="field__error"><Icon name="warning" size={13} /> {error}</p>
      ) : hint ? (
        <p className="field__hint">{hint}</p>
      ) : null}
    </div>
  )
}

export function Checkbox({ label, className = '', ...rest }) {
  const id = useId()
  return (
    <label htmlFor={id} className={cn('checkbox', className)}>
      <input id={id} type="checkbox" {...rest} />
      <span className="checkbox__box"><Icon name="check" size={12} /></span>
      <span>{label}</span>
    </label>
  )
}

export function RadioGroup({ name, options, value, onChange, className = '' }) {
  return (
    <div className={cn('radio-group', className)} role="radiogroup">
      {options.map((opt) => (
        <label key={opt.value} className="radio">
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
          />
          <span className="radio__dot" />
          <span>{opt.label}</span>
        </label>
      ))}
    </div>
  )
}

export function ToggleSwitch({ label, checked, onChange, className = '' }) {
  const id = useId()
  return (
    <label htmlFor={id} className={cn('toggle', className)}>
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle__track"><span className="toggle__thumb" /></span>
      {label && <span>{label}</span>}
    </label>
  )
}
