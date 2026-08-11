import { Routes, Route, Navigate } from 'react-router-dom'
import LoginForm from './features/auth/LoginForm'
import LoadingScreen from './shared/components/LoadingScreen'
import Hello from './demo/Hello'
import { useAuth } from './context/AuthContext'
import { useEffect, useState } from 'react'
import AuthenticatedLayout from './layout/AuthenticatedLayout'

function App() {
    const { role, isAuthLoading } = useAuth();
    const [ showLoadingScreen, setShowLoadingScreen ] = useState(false);

    useEffect(() => {
        if (!isAuthLoading) {
            setShowLoadingScreen(false);
            return;
        }

        const timer = setTimeout(() => setShowLoadingScreen(true), 100);
        return () => clearTimeout(timer);
    }, [isAuthLoading]);

    return (
        <>
            <div className="background"></div>
            {isAuthLoading
                ? (showLoadingScreen ? <LoadingScreen message="Checking your session..." /> : null)
                : (
                    <Routes>
                        <Route path="/login" element={<LoginForm />} />
                        <Route element={<AuthenticatedLayout />}>
                            <Route path="/hello" element={<Hello />} />
                        </Route>
                        <Route path="*" element={role ? <Navigate to="/hello" /> : <Navigate to="/login" />} />
                    </Routes>
                )
            }
        </>
    );
}

export default App