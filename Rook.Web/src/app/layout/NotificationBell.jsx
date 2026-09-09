import { useEffect, useState } from 'react'
import { IconButton } from '@shared/components/composite/Button'
import './NavLink.css'
import './NotificationBell.css'

// No notifications endpoint exists yet — this is deliberately just the
// shell (bell, panel, empty state) so wiring in real data later is a
// matter of replacing `notifications` with real state, not building the
// dropdown from scratch.
const notifications = []

export function NotificationBell() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="notif-bell">
      <IconButton
        icon="bell"
        label="Notifications"
        size={18}
        onClick={() => setOpen((o) => !o)}
      />
      {notifications.length > 0 && <span className="notif-bell__dot" aria-hidden="true" />}

      {open && (
        <>
          <div className="nav-scrim" onClick={() => setOpen(false)} />
          <div className="nav-dropdown__panel nav-dropdown__panel--below-end notif-bell__panel">
            <div className="notif-bell__header">Notifications</div>
            {notifications.length === 0 ? (
              <div className="notif-bell__empty">No notifications yet.</div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="notif-bell__item">{n.message}</div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
