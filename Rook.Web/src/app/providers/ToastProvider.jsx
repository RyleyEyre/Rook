import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { cn } from '@shared/utils/cn.js'
import { Icon } from '@shared/components/primitives/Icon'
import './ToastProvider.css'

const ToastContext = createContext(null)

let idCounter = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((toast) => toast.id !== id))
    clearTimeout(timers.current[id])
    delete timers.current[id]
  }, [])

  const push = useCallback((toast) => {
    const id = ++idCounter
    setToasts((t) => [...t, { id, tone: 'info', duration: 4500, ...toast }])
    timers.current[id] = setTimeout(() => dismiss(id), toast.duration ?? 4500)
    return id
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ push, dismiss }}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={cn('toast', `toast--${t.tone}`)}>
            <Icon name={t.tone === 'success' ? 'check' : t.tone === 'error' ? 'warning' : 'info'} size={16} />
            <div className="toast__body">
              {t.title && <strong>{t.title}</strong>}
              {t.message && <span>{t.message}</span>}
            </div>
            <button className="toast__close" onClick={() => dismiss(t.id)} aria-label="Dismiss">
              <Icon name="x" size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
