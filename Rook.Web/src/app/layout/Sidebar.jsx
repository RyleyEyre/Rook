import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@shared/utils/cn.js'
import { RookIcon, Icon } from '@shared/components/primitives/Icon'
import { Avatar } from '@shared/components/primitives/Avatar'
import { useAuth } from '@app/providers/AuthProvider.jsx'
import { NAV_ITEMS, isItemActive } from './nav.js'
import './NavLink.css'
import './Sidebar.css'

// Just a local UI preference for now — the plan is for this to move onto
// the user's profile (see UpdateEmployeeRequest) once there's a field for
// it there. localStorage is a fine stand-in in the meantime since it
// already gives us "remembered across sessions" for free.
const COLLAPSE_STORAGE_KEY = 'rook:sidebar-collapsed'

// `openId`/`toggle`/`close` come from AppShell now rather than a local
// useOpenMenu() call here — GlobalSearch (over in TopBar, a sibling of
// this component) needs to be able to close whatever submenu is open too,
// so the "which submenu is open" state has to live somewhere both can
// reach rather than be private to Sidebar.
export function Sidebar({ openId, toggle, close }) {
  const { pathname } = useLocation()
  const { username, role } = useAuth()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_STORAGE_KEY) === '1')

  useEffect(() => {
    localStorage.setItem(COLLAPSE_STORAGE_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  return (
    <aside className={cn('side-nav', collapsed && 'side-nav--collapsed')}>
      <div className="side-nav__brand">
        <RookIcon size={22} />
        <span>Rook</span>
      </div>
      <nav className="side-nav__links">
        {NAV_ITEMS.map((item) => {
          const active = isItemActive(item, pathname)
          if (!item.children) {
            return (
              <Link key={item.id} to={item.to} className={cn('nav-link', 'side-full-width', active && 'is-active')}>
                <Icon name={item.icon} size={17} />
                <span className="side-nav-label">{item.label}</span>
              </Link>
            )
          }
          const open = openId === item.id
          return (
            <div className={cn('nav-dropdown', 'side-full-width')} key={item.id}>
              <button
                className={cn('nav-link', 'side-full-width', active && 'is-active')}
                onClick={() => toggle(item.id)}
                aria-expanded={open}
              >
                <Icon name={item.icon} size={17} />
                <span className="side-nav-label">{item.label}</span>
                <Icon name="chevronRight" size={13} className={cn('nav-dropdown__chevron', 'side-nav-chevron', open && 'is-open-right')} />
              </button>
              {open && (
                <>
                  <div className="nav-scrim" onClick={close} />
                  <div className="nav-dropdown__panel nav-dropdown__panel--right">
                    {item.children.map((child) => (
                      <Link
                        key={child.id}
                        to={child.to}
                        className={cn('nav-dropdown__item', pathname.startsWith(child.to) && 'is-active')}
                        onClick={close}
                      >
                        <Icon name={child.icon} size={15} />
                        <span>{child.label}</span>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </nav>
      <Link className={cn('side-nav__user', 'nav-link')} to="/profile">
        <Avatar name={username ?? '?'} size={32} />
        <div className="side-nav__user-info">
          <span className="side-nav__user-name">{username}</span>
          <span className="side-nav__user-role">{role}</span>
        </div>
      </Link>

      <button
        type="button"
        className="side-nav__collapse-toggle"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <Icon name="chevronRight" size={15} className={cn('side-nav__collapse-icon', !collapsed && 'is-flipped')} />
        <span className="side-nav-label">Collapse</span>
      </button>
    </aside>
  )
}
