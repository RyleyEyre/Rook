import './LoginPage.css'

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@app/providers/AuthProvider.jsx'
import { useToast } from '@app/providers/ToastProvider.jsx'
import { login } from '@services/api/authApi.js'
import { RookIcon } from '@shared/components/primitives/Icon'
import { TextInput } from '@shared/components/composite/Field'
import { Button } from '@shared/components/composite/Button'
import { Banner } from '@shared/components/composite/Banner'

function LoginPage() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [status, setStatus] = useState('idle') // idle | loading | success
    const [error, setError] = useState(null)

    const { setAccessToken, setUsername: setAuthUsername, setRole, setUserProfile } = useAuth()
    const { push } = useToast()
    const navigate = useNavigate()

    const handleUsernameChange = (e) => {
        setUsername(e.target.value)
        setError(null)
    }

    const handlePasswordChange = (e) => {
        setPassword(e.target.value)
        setError(null)
    }

    const MIN_LOADING_MS = 700

    const submit = async (e) => {
        e.preventDefault()

        if (!username || !password) {
            setError({
                title: 'Missing information',
                message: !username && !password
                    ? 'Enter both a username and password to continue.'
                    : !username
                        ? 'Enter your username to continue.'
                        : 'Enter your password to continue.',
            })
            return
        }

        setStatus('loading')

        const minDelay = new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS))
        const [loggedIn] = await Promise.all([login(username, password), minDelay])

        if (loggedIn.success) {
            setAccessToken(loggedIn.accessToken)
            setAuthUsername(loggedIn.username)
            setRole(loggedIn.role)
            setUserProfile(loggedIn.userProfile)
            setStatus('success')
            setError(null)

            push({ tone: 'success', title: 'Signed in', message: `Welcome back, ${loggedIn.username}.` })

            setTimeout(() => navigate('/employees'), 1000)
            return
        }

        setStatus('idle')

        if (loggedIn.status === 401 || loggedIn.status === 400) {
            setError({ title: 'Sign-in failed', message: 'Invalid username or password.' })
        } else {
            setError({ title: 'Connection problem', message: 'Unable to reach the server. Please try again.' })
        }
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-card__brand">
                    <RookIcon size={26} />
                    <span>Rook</span>
                </div>
                <h1>Sign in to your account</h1>
                <p className="login-card__subtitle">Warehouse Manager</p>

                <form onSubmit={submit}>
                    <TextInput
                        label="Username"
                        icon="user"
                        value={username}
                        onChange={handleUsernameChange}
                        autoComplete="username"
                        required
                    />
                    <TextInput
                        label="Password"
                        type="password"
                        icon="lock"
                        value={password}
                        onChange={handlePasswordChange}
                        autoComplete="current-password"
                        required
                    />
                    <Button type="submit" loading={status === 'loading'} disabled={status === 'loading' || status === 'success'}>
                        {status === 'loading' ? 'Signing in…' : status === 'success' ? 'Signed in' : 'Sign in'}
                    </Button>

                    <div className="login-card__notice-slot">
                        {error && (
                            <Banner tone="error" title={error.title} dismissible onDismiss={() => setError(null)}>
                                {error.message}
                            </Banner>
                        )}
                        {status === 'success' && (
                            <Banner tone="success" title="Signed in">Redirecting...</Banner>
                        )}
                    </div>
                </form>
            </div>
        </div>
    )
}

export default LoginPage
