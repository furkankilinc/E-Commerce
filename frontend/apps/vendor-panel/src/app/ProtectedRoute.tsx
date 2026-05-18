import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { authStore } from '../features/auth/auth.store';

function isTokenExpired(token: string | null): boolean {
    if (!token) return true;
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return true;
        const payloadDecoded = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
        const payload = JSON.parse(payloadDecoded);
        if (!payload.exp) return false;
        
        // Expiration check with a 5-second buffer
        const now = Math.floor(Date.now() / 1000);
        return payload.exp <= now + 5;
    } catch {
        return true;
    }
}

const ProtectedRoute: React.FC = () => {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(authStore.isAuthenticated());

    useEffect(() => {
        if (!authStore.isAuthenticated()) {
            setIsAuthenticated(false);
            return;
        }

        const checkToken = async () => {
            const token = authStore.getToken();
            const refToken = authStore.getRefreshToken();

            if (isTokenExpired(token)) {
                if (refToken) {
                    try {
                        const res = await fetch('/api/auth/merchant/refresh', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ refreshToken: refToken })
                        });

                        if (res.ok) {
                            const data = await res.json();
                            authStore.setAccessToken(data.accessToken);
                            if (data.refreshToken) {
                                authStore.setAuth(data.accessToken, data.refreshToken, authStore.getMerchant()!);
                            }
                        } else {
                            throw new Error('Refresh failed');
                        }
                    } catch (err) {
                        console.error('[Token Heartbeat] Token refresh failed, logging out...', err);
                        authStore.clearAuth();
                        setIsAuthenticated(false);
                        navigate('/login', { replace: true });
                    }
                } else {
                    authStore.clearAuth();
                    setIsAuthenticated(false);
                    navigate('/login', { replace: true });
                }
            }
        };

        // Run immediately on mount
        checkToken();

        // Run heartbeat every 5 seconds
        const interval = setInterval(checkToken, 5000);

        return () => clearInterval(interval);
    }, [navigate]);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
