import { Link } from 'react-router-dom'
import { Avatar } from '@shared/components/primitives/Avatar'
import { IconButton } from '@shared/components/composite/Button'
import { useAuth } from '@app/providers/AuthProvider.jsx'
import { useLogout } from '@app/hooks/useLogout.js'
import { GlobalSearch } from './GlobalSearch.jsx'
import { NotificationBell } from './NotificationBell.jsx'
import './TopBar.css'

export function TopBar({ onSearchFocus }) {
  const { username } = useAuth()
  const logout = useLogout()

  return (
    <header className="top-bar">
      <GlobalSearch onFocusSearch={onSearchFocus} />
      <div className="top-bar__spacer" />
      <NotificationBell />
      <Link className="top-bar__profile" to="/profile" title="Profile">
        <Avatar name={username ?? '?'} size={28} />
      </Link>
      <IconButton icon="logout" label="Log out" size={18} onClick={logout} />
    </header>
  )
}
