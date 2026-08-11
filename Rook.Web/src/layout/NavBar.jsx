import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import RookIcon from '../shared/components/RookIcon';
import './NavBar.css';
import { logout } from '../features/auth/authApi';
import { useNavigate } from 'react-router-dom';
import { saveUserProfile } from '../features/user/userApi';

const navItems = [
    { label: 'Temp A', subLinks: ['Temp AA', 'Temp AB', 'Temp AC'] },
    { label: 'Temp B', subLinks: ['Temp BA', 'Temp BB', 'Temp BC'] },
    { label: 'Temp C', subLinks: ['Temp CA', 'Temp CB', 'Temp CC'] },
];

const themes = [
    { key: 'crimson', label: 'Crimson', color: '#cf3b3b' },
    { key: 'emerald', label: 'Emerald', color: '#2fa66b' },
    { key: 'azure', label: 'Azure', color: '#3b82cf' },
    { key: 'purple', label: 'Purple', color: '#8b5cf6' },
    { key: 'amber', label: 'Amber', color: '#f59e0b' },
];

function NavBar() {
    const { setAccessToken, setUsername, setRole, username, role, userProfile, setUserProfile } = useAuth();
    const navigate = useNavigate();

    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);

    const theme = userProfile?.theme ?? 'crimson';

    // Directly setting a data attribute on the document root since our CSS theme variables are scoped globally via [data-theme] selectors
    // not tied to any single components markup.
    useEffect(() => {
        if (theme === 'crimson') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }


    }, [theme]);

    // Updates both the in memory context (so UI changes immediately) and sessionStorage (so the theme survives a page refresh)
    // mirrors the same dual write pattern for tokens elsewhere.
    useEffect(() => {
        function handleClickOutside(event) {
            if (
                userMenuRef.current &&
                !userMenuRef.current.contains(event.target)
            ) {
                setIsUserMenuOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = async () => {
        const loggedOut = await logout();

        if (loggedOut) {
            setAccessToken(null);
            setUsername(null);
            setRole(null);
            navigate('/login');
        }
    };

    const handleThemeChange = (selectedTheme) => {
        const updatedUserProfile = {
            ...userProfile,
            theme: selectedTheme
        };
        
        setUserProfile(updatedUserProfile);
        saveUserProfile(updatedUserProfile);
    };

    return (
        <nav className="navbar">
            <div className="nav-left">
                <div className="nav-logo">
                    <div className="pixel">
                        <RookIcon size={20} color="white" />
                    </div>
                    <span>ROOK</span>
                </div>

                <div className="nav-links">
                    {navItems.map((item) => (
                        <div className="nav-item" key={item.label}>
                            <a href="#">{item.label}</a>

                            <div className="nav-dropdown">
                                {item.subLinks.map((sub) => (
                                    <a href="#" key={sub}>
                                        {sub}
                                    </a>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="nav-user" ref={userMenuRef}>
                <div
                    className="nav-user-trigger"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                >
                    <div className="nav-user-info">
                        <span className="nav-username">{username}</span>
                        <span className="nav-role">{role}</span>
                    </div>
                </div>

                {isUserMenuOpen && (
                    <div className="nav-user-dropdown">
                        <div className="nav-dropdown-section">
                            <span className="nav-dropdown-label">
                                Appearance
                            </span>

                            <div className="nav-flyout-item">
                                <span className="nav-flyout-trigger">
                                    <span className="nav-flyout-arrow">‹</span>
                                    Theme
                                </span>

                                <div className="nav-flyout">
                                    {themes.map((t) => (
                                        <button
                                            key={t.key}
                                            onClick={() => handleThemeChange(t.key)}
                                            className="theme-button"
                                        >
                                            <div className="theme-left">
                                                <span
                                                    className="theme-dot"
                                                    style={{
                                                        background: t.color,
                                                    }}
                                                />

                                                {t.label}
                                            </div>

                                            {theme === t.key && (
                                                <span className="theme-check">
                                                    ✓
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="nav-dropdown-section">
                            <span className="nav-dropdown-label">
                                Account
                            </span>

                            <button onClick={handleLogout}>
                                Log out
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}

export default NavBar;