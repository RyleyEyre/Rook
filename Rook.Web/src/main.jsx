import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './app/App.jsx';
import { AuthProvider } from './app/providers/AuthProvider.jsx';
import { ToastProvider } from './app/providers/ToastProvider.jsx';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <ToastProvider>
                     <App />
                </ToastProvider>
            </AuthProvider>
        </BrowserRouter>
    </StrictMode>,
);
