import { Link, useLocation } from 'react-router-dom'
import { cn } from '@shared/utils/cn.js'
import { RookIcon, Icon } from '@shared/components/primitives/Icon'
import { Avatar } from '@shared/components/primitives/Avatar'
import { useAuth } from '@app/providers/AuthProvider.jsx'
import { NAV_ITEMS, useOpenMenu, isItemActive } from './nav.js'
import './NavLink.css'
import './Header.css'

export function Header() {
  const { pathname } = useLocation()
  const { username } = useAuth()
  const { openId, toggle, close } = useOpenMenu()

  return (
    <header className="top-nav">
      <div className="top-nav__brand">
        <RookIcon size={20} />
        <span>Rook</span>
      </div>
      <nav className="top-nav__links">
        {NAV_ITEMS.map((item) => {
          const active = isItemActive(item, pathname)
          if (!item.children) {
            return (
              <Link key={item.id} to={item.to} className={cn('nav-link', active && 'is-active')}>
                <Icon name={item.icon} size={16} />
                <span>{item.label}</span>
              </Link>
            )
          }
          const open = openId === item.id
          return (
            <div className="nav-dropdown" key={item.id}>
              <button
                className={cn('nav-link', active && 'is-active')}
                onClick={() => toggle(item.id)}
                aria-expanded={open}
              >
                <Icon name={item.icon} size={16} />
                <span>{item.label}</span>
                <Icon name="chevronDown" size={13} className={cn('nav-dropdown__chevron', open && 'is-open-down')} />
              </button>
              {open && (
                <>
                  <div className="nav-scrim" onClick={close} />
                  <div className="nav-dropdown__panel nav-dropdown__panel--below">
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
      <div className="top-nav__spacer" />
      <Link className="top-nav__user" to="/profile">
        <Avatar name={username ?? '?'} size={28} />
        <span className="top-nav__user-name">{username}</span>
      </Link>
    </header>
  )
}
