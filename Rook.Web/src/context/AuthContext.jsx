import { createContext, useState, useContext, useEffect } from "react";
import { jwtDecode } from 'jwt-decode';
import { refreshTokens } from "../features/auth/authApi";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

function AuthProvider({ children }) {
    const [accessToken, setAccessToken] = useState(null);
    const [username, setUsername] = useState(null);
    const [role, setRole] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    const navigate = useNavigate();

    useEffect(() => {

        // CheckAuth function is required as async useffect cannot be directly declared as async,
        // async functions always return a promise which conflicts, using a seperate async function inside
        // of the useEffect gets around this.
        async function checkAuth(){
            const storedAccessToken = sessionStorage.getItem('accessToken');
            const storedUserProfile = sessionStorage.getItem('userProfile');

            if (storedAccessToken) {
                const decoded = jwtDecode(storedAccessToken);
                const isExpired = decoded.exp * 1000 < Date.now();

                if (isExpired){
                    const refreshedTokens = await refreshTokens();

                    if (!refreshedTokens){
                        navigate('/login');
                        // Artificial minimum delay so the loading state is visible rather than flashing
                        // instantly, even though the real check usually completes faster than this.
                        await new Promise(resolve => setTimeout(resolve, 400));
                        setIsAuthLoading(false)
                        return;
                    }

                    setAccessToken(refreshedTokens.accessToken);
                    setUsername(refreshedTokens.username);
                    setRole(refreshedTokens.role);
                    setUserProfile(refreshedTokens.userProfile)
                    await new Promise(resolve => setTimeout(resolve, 400));
                    setIsAuthLoading(false)
                    return;
                }

                setAccessToken(storedAccessToken);
                setUsername(decoded.username);
                setRole(decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']);

                if (storedUserProfile){
                    setUserProfile(JSON.parse(storedUserProfile));
                }
                await new Promise(resolve => setTimeout(resolve, 400));
                setIsAuthLoading(false)

            } else {
                await new Promise(resolve => setTimeout(resolve, 400));
                setIsAuthLoading(false)
                navigate('/login');
            }
        }

        checkAuth();
    }, []);

    const value = {
        accessToken,
        username,
        role,
        userProfile,
        isAuthLoading,
        setAccessToken,
        setUsername,
        setRole,
        setUserProfile,
        setIsAuthLoading,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

function useAuth() {
    const context = useContext(AuthContext);
    if(!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export {AuthContext, AuthProvider, useAuth}
