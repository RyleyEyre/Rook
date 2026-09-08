import { Link, useLocation } from 'react-router-dom'
import { cn } from '@shared/utils/cn.js'
import { RookIcon, Icon } from '@shared/components/primitives/Icon'
import { Avatar } from '@shared/components/primitives/Avatar'
import { useAuth } from '@app/providers/AuthProvider.jsx'
import { NAV_ITEMS, useOpenMenu, isItemActive } from './nav.js'
import './NavLink.css'
import './Sidebar.css'

export function Sidebar() {
  const { pathname } = useLocation()
  const { username, role } = useAuth()
  const { openId, toggle, close } = useOpenMenu()

  return (
    <aside className="side-nav">
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
    </aside>
  )
}
