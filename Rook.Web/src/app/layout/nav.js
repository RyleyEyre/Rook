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

// Flattens NAV_ITEMS into a flat list of actually-navigable pages — a
// parent with children (e.g. "Employees") isn't itself a destination, so
// its children are what get listed, each tagged with the parent's label
// as `group` for context (e.g. Departments shows as "Employees" group).
// This is what GlobalSearch matches against.
export function flattenNavItems(items) {
  const flat = []
  for (const item of items) {
    if (item.children) {
      for (const child of item.children) {
        flat.push({ id: child.id, label: child.label, icon: child.icon, to: child.to, group: item.label })
      }
    } else {
      flat.push({ id: item.id, label: item.label, icon: item.icon, to: item.to })
    }
  }
  return flat
}
