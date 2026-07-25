import { useState, useRef } from "react";
import { useAuth } from '../../context/AuthContext.jsx';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom'
import './LoginForm.css'
import  RookIcon from '../icons/RookIcon.jsx'
import { login } from '../../api/authApi';

function LoginForm(){
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState(false);

    
    // SetUsername is destructured to setAuthUsername as setUsername is already part of the useState above.
    const { setAccessToken, setUsername: setAuthUsername, setRole, setUserProfile } = useAuth();
    const navigate = useNavigate();
    const timeoutRef = useRef();

    const handleSubmit = async (e) => {
        e.preventDefault();

        const loggedIn = await login(username, password)
        if (loggedIn.success) {
            setAccessToken(loggedIn.accessToken);
            setAuthUsername(loggedIn.username);
            setRole(loggedIn.role);
            setUserProfile(loggedIn.userProfile);

            navigate('/hello');
        }

        clearTimeout(timeoutRef.current);

        if (loggedIn.status === 401) {
            setErrorMessage("Incorrect username or password");
        } else {
            setErrorMessage("Unable to reach the server. Please try again.");
        }

        timeoutRef.current = setTimeout(() => setErrorMessage(""), 3000);

        };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-emblem">
                    <div className="pixel">
                        <RookIcon size={20} color="white" />
                    </div>
                    <span>ROOK</span>
                </div>
                <h1>Welcome back</h1>
                <p className="login-subtitle">Log in to continue</p>
                <form onSubmit={handleSubmit}>
                    <div className="form-field">
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div className="form-field">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn-primary">Log In</button>
                    <div className="login-error">
                        {errorMessage}
                    </div>
                </form>
            </div>
        </div>
    );
}

export default LoginForm;