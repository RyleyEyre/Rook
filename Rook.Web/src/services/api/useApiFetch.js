import { useAuth } from "@app/providers/AuthProvider.jsx";
import { useLiveConnectionContext } from "@app/providers/LiveConnectionProvider.jsx";
import { useNavigate } from "react-router-dom";
import { refreshTokens } from "./authApi.js";

const CONNECTION_ID_HEADER = "X-SignalR-Connection-Id";

function useApiFetch() {
    const { accessToken, setAccessToken, setUsername, setRole, setUserProfile } = useAuth();
    const { connectionId } = useLiveConnectionContext();
    const navigate = useNavigate();

    async function apiFetch(url, options = {}) {

        const headers = {
            ...options.headers,
            Authorization: `Bearer ${accessToken}`,
            // Omitted until the hub connection is actually up (e.g. the very
            // first request or two right after login) — the backend just
            // won't have anything to exclude for those, same as before.
            ...(connectionId ? { [CONNECTION_ID_HEADER]: connectionId } : {}),
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
            ...(connectionId ? { [CONNECTION_ID_HEADER]: connectionId } : {}),
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
