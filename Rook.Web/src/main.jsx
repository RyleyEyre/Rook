import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './app/App.jsx';
import { AuthProvider } from './app/providers/AuthProvider.jsx';
import { HealthProvider } from './app/providers/HealthProvider.jsx';
import { LiveConnectionProvider } from './app/providers/LiveConnectionProvider.jsx';
import { ToastProvider } from './app/providers/ToastProvider.jsx';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <HealthProvider>
                    <LiveConnectionProvider>
                        <ToastProvider>
                             <App />
                        </ToastProvider>
                    </LiveConnectionProvider>
                </HealthProvider>
            </AuthProvider>
        </BrowserRouter>
    </StrictMode>,
);
