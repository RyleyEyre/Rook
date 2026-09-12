import { useAuth } from "@app/providers/AuthProvider.jsx";
import { useLiveConnectionContext } from "@app/providers/LiveConnectionProvider.jsx";
import { useHealthContext } from "@app/providers/HealthProvider.jsx";
import { useNavigate } from "react-router-dom";
import { refreshTokens } from "./authApi.js";

const CONNECTION_ID_HEADER = "X-SignalR-Connection-Id";

function useApiFetch() {
    const { accessToken, setAccessToken, setUsername, setRole, setUserProfile } = useAuth();
    const { connectionId } = useLiveConnectionContext();
    const { reportPossibleOutage } = useHealthContext();
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

        // A thrown fetch — not just a non-2xx response — means the request
        // never got a response from the server at all (DNS failure,
        // connection refused, CORS block, etc.). That's real, immediate
        // evidence the backend might be down, distinct from a normal HTTP
        // error status (a 404 or a 409 still means the server is up and
        // answering, just with a business-logic rejection — that's not
        // this). Nudging HealthProvider to check right now means it
        // doesn't have to wait up to its own 2-minute healthy-interval to
        // notice something this page's own error handling already knows.
        let response;
        try {
            response = await fetch(url, {
                ...options,
                headers,
            });
        } catch (error) {
            reportPossibleOutage?.();
            throw error;
        }

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

        let retryResponse;
        try {
            retryResponse = await fetch(url, {
                ...options,
                headers: retryHeaders,
            });
        } catch (error) {
            reportPossibleOutage?.();
            throw error;
        }

        return retryResponse;

    }

    return apiFetch;
}

export { useApiFetch };
