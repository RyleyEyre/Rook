import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, useEffect, useState } from 'react'
import { useAuth } from './providers/AuthProvider.jsx'
import { useConnectivityWatchdog } from './hooks/useConnectivityWatchdog.js'
import { AppShell } from './layout/AppShell.jsx'
import { appRoutes, LoginPage } from './routes.jsx'

const PageFallback = () => <div style={{ padding: 40, color: 'var(--color-text-muted)', fontSize: 13.5 }}>Loading…</div>

function App() {
    const { role, isAuthLoading } = useAuth();
    const [showLoadingScreen, setShowLoadingScreen] = useState(false);

    // Called here rather than in any individual page — App never unmounts
    // during navigation between pages, which is the whole point: how long
    // the backend's been unreachable has to be tracked across page
    // switches, not reset by them.
    useConnectivityWatchdog();

    useEffect(() => {
        if (!isAuthLoading) {
            setShowLoadingScreen(false);
            return;
        }

        const timer = setTimeout(() => setShowLoadingScreen(true), 100);
        return () => clearTimeout(timer);
    }, [isAuthLoading]);

    if (isAuthLoading) {
        return showLoadingScreen ? <div>Checking your session...</div> : null;
    }

    return (
        <Routes>
            <Route path="/login" element={<Suspense fallback={<PageFallback />}><LoginPage /></Suspense>} />

            <Route element={<AppShell />}>
                {appRoutes.map(({ path, Component }) => (
                    <Route key={path} path={path} element={<Suspense fallback={<PageFallback />}><Component /></Suspense>} />
                ))}
            </Route>

            <Route
                path="*"
                element={role ? <Navigate to="/employees" /> : <Navigate to="/login" />}
            />
        </Routes>
    );
}

export default App
