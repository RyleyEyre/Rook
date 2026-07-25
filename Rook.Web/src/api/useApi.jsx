import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { refreshTokens } from "./authApi";

function useApiFetch() {
    const { accessToken, setAccessToken, setUsername, setRole, setUserProfile } = useAuth();
    const navigate = useNavigate();

    async function apiFetch(url, options = {}) {
        
        const headers = {
            ...options.headers,
            Authorization: `Bearer ${accessToken}`
        };

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (response.status !== 401) {
            return response;
        }

        const refreshedTokens = await refreshTokens();

        if (!refreshedTokens) {
            setAccessToken(null);
            setUsername(null);
            setRole(null);
            setUserProfile(null)
            navigate('/login');
            return response;
        }

        setAccessToken(refreshedTokens.accessToken);
        setUsername(refreshedTokens.username);
        setRole(refreshedTokens.role);

        const retryHeaders = {
            ...options.headers,
            Authorization: `Bearer ${refreshedTokens.accessToken}`,
        };

        const retryResponse = await fetch(url, {
            ...options,
            headers: retryHeaders,
        });

        return retryResponse;

    }

    return apiFetch;
}

export { useApiFetch };