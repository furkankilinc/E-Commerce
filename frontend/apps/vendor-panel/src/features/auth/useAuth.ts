import { useState, useCallback } from 'react';
import { authStore } from './auth.store';

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

    return {
        isAuthenticated,
        merchant,
        login,
        logout
    };
};
