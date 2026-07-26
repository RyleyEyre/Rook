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
    const [errorMessage, setErrorMessage] = useState('');
    const [missingFields, setMissingFields] = useState([]);

    
    // SetUsername is destructured to setAuthUsername as setUsername is already part of the useState above.
    const { setAccessToken, setUsername: setAuthUsername, setRole, setUserProfile } = useAuth();
    const navigate = useNavigate();
    const timeoutRef = useRef();

    const handleSubmit = async (e) => {
        e.preventDefault();

        const missing = [];

        if (!username) missing.push("username");
        if (!password) missing.push("password");

        if (missing.length > 0) {
            setMissingFields(missing);

            if (missing.length === 2) {
                setErrorMessage("Please enter your username and password.");
            } else if (missing.includes("username")) {
                setErrorMessage("Please enter your username.");
            } else {
                setErrorMessage("Please enter your password.");
            }
            clearTimeout(timeoutRef.current);

            timeoutRef.current = setTimeout(() => {
                setMissingFields([]);
                setErrorMessage("");
            }, 3000);
            return;
        }

        setMissingFields([]);
        const loggedIn = await login(username, password)
        if (loggedIn.success) {
            setAccessToken(loggedIn.accessToken);
            setAuthUsername(loggedIn.username);
            setRole(loggedIn.role);
            setUserProfile(loggedIn.userProfile);
            navigate('/hello');
            return;
        }

        clearTimeout(timeoutRef.current);

        if (loggedIn.status === 401 || loggedIn.status === 400) {
            console.log(loggedIn.status)
            setErrorMessage("Incorrect username or password.");
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
                            className={missingFields.includes("username") ? "input-missing" : ""}
                            onChange={(e) => {
                                setUsername(e.target.value);
                                setMissingFields(prev => prev.filter(field => field !== "username"));
                            }}
                        />
                    </div>
                    <div className="form-field">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            className={missingFields.includes("password") ? "input-missing" : ""}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setMissingFields(prev => prev.filter(field => field !== "password"));
                            }}
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