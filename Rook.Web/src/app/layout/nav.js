import { useEffect, useState } from 'react'

// The playground's nav item only shows up in dev — see dev/playground/ and
// app/routes.jsx for why that page is excluded from prod entirely.
const DEV_NAV_ITEMS = [
  { id: 'sink', label: 'Components', icon: 'filter', to: '/kitchen-sink' },
]

export const NAV_ITEMS = [
  {
    id: 'employees', label: 'Employees', icon: 'grid',
    children: [
      { id: 'table', label: 'All Employees', icon: 'grid', to: '/employees' },
      { id: 'departments', label: 'Departments', icon: 'folder', to: '/departments' },
      { id: 'shiftPatterns', label: 'Shift Patterns', icon: 'clock', to: '/shift-patterns' },
    ],
  },
  { id: 'settings', label: 'Settings', icon: 'gear', to: '/settings' },
  { id: 'profile', label: 'Profile', icon: 'user', to: '/profile' },
  ...(import.meta.env.DEV ? DEV_NAV_ITEMS : []),
]

// Shared by Header (dropdown opens below) and Sidebar (sideout opens to
// the right) — only one submenu open at a time, closed by outside click
// or Esc.
export function useOpenMenu() {
  const [openId, setOpenId] = useState(null)
  const close = () => setOpenId(null)
  const toggle = (id) => setOpenId((current) => (current === id ? null : id))

  useEffect(() => {
    if (!openId) return
    const onKey = (e) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openId])

  return { openId, toggle, close }
}

export function isItemActive(item, pathname) {
  return item.children
    ? item.children.some((c) => pathname.startsWith(c.to))
    : pathname.startsWith(item.to)
}
