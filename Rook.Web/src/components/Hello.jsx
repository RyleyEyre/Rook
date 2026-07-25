import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApiFetch } from '../api/useApi.jsx';
import { Link } from 'react-router-dom';

function Hello() {
    const { accessToken, username, role, isAuthLoading } = useAuth();
    const apiFetch = useApiFetch();
    const [message, setMessage] = useState(null);

    useEffect(() => {
        if (isAuthLoading){
            return;
        }

        async function loadSecureData() {
            const response = await apiFetch('http://localhost:5248/api/Test/secure');
            const text = await response.text();
            setMessage(text);
        }

        loadSecureData();
    }, [isAuthLoading]);

    if (isAuthLoading) {
        return <div>Loading...</div>;
    }
    if (role !== 'User') {
        return <div>Unauthorised</div>;
    }

    return (
        <div>
            <div>Hello, {username}!</div>
            <div>{message}</div>
        </div>
    );
}

export default Hello;