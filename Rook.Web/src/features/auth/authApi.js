import { jwtDecode } from "jwt-decode";
import { API_URL } from "../../shared/api/config";

// RefreshTokens does not touch any react state, this function is 'dumb' by design and the caller decides what to do
// if the tokens are expired. Local storage is owned here so it is responsible for updating them.
async function refreshTokens() {
    const storedRefreshToken = sessionStorage.getItem('refreshToken');

    if (!storedRefreshToken) {
        return null;
    }

    try {
        const response = await fetch(`${API_URL}/api/Auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: storedRefreshToken }),
        });

        if (!response.ok) {
            sessionStorage.removeItem('accessToken');
            sessionStorage.removeItem('refreshToken');
            sessionStorage.removeItem('userProfile')
            return null;
        }

        const authResponse = await response.json();
        const decoded = jwtDecode(authResponse.data.accessToken);

        sessionStorage.setItem('accessToken', authResponse.data.accessToken);
        sessionStorage.setItem('refreshToken', authResponse.data.refreshToken);
        sessionStorage.setItem('userProfile', JSON.stringify(authResponse.data.userProfile));

        return {
            accessToken: authResponse.data.accessToken,
            username: decoded.username,
            role: decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
            userProfile: authResponse.data.userProfile,
        };
    } catch (error) {
        console.log('Network error', error);
        return null;
    }
}

async function login(username, password) {
    try{
        const response = await fetch(`${API_URL}/api/Auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            return { success: false, status: response.status };
        }

        const authResponse = await response.json();
        const decoded = jwtDecode(authResponse.data.accessToken);

        sessionStorage.setItem('accessToken', authResponse.data.accessToken);
        sessionStorage.setItem('refreshToken', authResponse.data.refreshToken);
        sessionStorage.setItem('userProfile', JSON.stringify(authResponse.data.userProfile));

        return {
            success: true,
            accessToken: authResponse.data.accessToken,
            username: decoded.username,
            role: decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
            userProfile: authResponse.data.userProfile,
        }

    } catch (error) {
        console.log('Network error', error);
        return { success: false, status: null };
    } 
}

async function logout() {
    const storedRefreshToken = sessionStorage.getItem('refreshToken');

    // We return true for all outcomes because in all cases because without the access & refresh tokens the user is effectively logged out
    // regardless of whether the backend succeeded. This is ok now but may need fully flushing out in the future //TODO
    if (!storedRefreshToken) {
        return true;
    }

    try{
        const response = await fetch(`${API_URL}/api/Auth/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: storedRefreshToken }),
        });

        if (!response.ok) {
            console.log(response.status);
        }

    } catch (error) {
        console.log('Network error', error);
    }        
    
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('userProfile')
    return true;

}

export { refreshTokens, logout, login };