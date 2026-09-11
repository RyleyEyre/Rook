import { useNavigate } from 'react-router-dom'
import { useAuth } from '@app/providers/AuthProvider.jsx'
import { logout } from '@services/api/authApi.js'

// Returns an async function that logs the person out and redirects to
// /login. logout() itself already clears sessionStorage and tries to tell
// the backend regardless of whether that call succeeds — this also clears
// the in-memory auth state so the rest of the app (useApiFetch, route
// guards) sees the logged-out state immediately rather than on next reload.
function useLogout() {
  const { setAccessToken, setUsername, setRole, setUserProfile } = useAuth()
  const navigate = useNavigate()

  return async function logoutAndRedirect() {
    await logout()
    setAccessToken(null)
    setUsername(null)
    setRole(null)
    setUserProfile(null)
    navigate('/login')
  }
}

export { useLogout }
