import { Link, useNavigate } from 'react-router-dom'
import { Avatar } from '@shared/components/primitives/Avatar'
import { IconButton } from '@shared/components/composite/Button'
import { useAuth } from '@app/providers/AuthProvider.jsx'
import { logout } from '@services/api/authApi.js'
import { GlobalSearch } from './GlobalSearch.jsx'
import { NotificationBell } from './NotificationBell.jsx'
import './TopBar.css'

export function TopBar({ onSearchFocus }) {
  const { username, setAccessToken, setUsername, setRole, setUserProfile } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    // logout() already clears sessionStorage itself (see authApi.js) and
    // tries to tell the backend regardless of whether that call succeeds —
    // this just needs to also clear the in-memory auth state so the rest
    // of the app (useApiFetch, route guards) sees the logged-out state
    // immediately rather than on next reload.
    await logout()
    setAccessToken(null)
    setUsername(null)
    setRole(null)
    setUserProfile(null)
    navigate('/login')
  }

  return (
    <header className="top-bar">
      <GlobalSearch onFocusSearch={onSearchFocus} />
      <div className="top-bar__spacer" />
      <NotificationBell />
      <Link className="top-bar__profile" to="/profile" title="Profile">
        <Avatar name={username ?? '?'} size={28} />
      </Link>
      <IconButton icon="logout" label="Log out" size={18} onClick={handleLogout} />
    </header>
  )
}
