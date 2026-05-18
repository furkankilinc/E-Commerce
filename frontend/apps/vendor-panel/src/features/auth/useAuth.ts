import { useState, useCallback, useEffect } from 'react';
import { authStore } from './auth.store';
import { apiClient } from '../../shared/api/apiClient';


export const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(authStore.isAuthenticated());
    const [merchant, setMerchant] = useState(authStore.getMerchant());

    const login = useCallback((accessToken: string, refreshToken: string, merchantData: any) => {
        authStore.setAuth(accessToken, refreshToken, merchantData);
        setIsAuthenticated(true);
        setMerchant(merchantData);
    }, []);

    const logout = useCallback(() => {
        authStore.clearAuth();
        setIsAuthenticated(false);
        setMerchant(null);
    }, []);

    // Periodic background refresh (every 10 minutes)
    useEffect(() => {
        if (!isAuthenticated) return;

        const interval = setInterval(async () => {
            try {
                const rfToken = authStore.getRefreshToken();
                if (rfToken) {
                    const res = await apiClient.post('/api/auth/merchant/refresh', { refreshToken: rfToken });
                    if (res.ok) {
                        const data = await res.json();
                        authStore.setAuth(data.accessToken, data.refreshToken, data.merchant || authStore.getMerchant()!);
                    } else if (res.status === 401) {
                        logout();
                    }
                }
            } catch (err) {
                console.error('Background refresh failed:', err);
            }
        }, 10 * 60 * 1000); // 10 minutes

        return () => clearInterval(interval);
    }, [isAuthenticated, logout]);

    return {
        isAuthenticated,
        merchant,
        login,
        logout
    };
};


