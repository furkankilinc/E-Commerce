import { useState, useCallback } from 'react';
import { authStore } from './auth.store';

export const useAuth = () => {
    const [user, setUser] = useState(authStore.getUser());
    const [isAuthenticated, setIsAuthenticated] = useState(authStore.isAuthenticated());

    const login = useCallback((token: string, userData: any, refreshToken?: string) => {
        authStore.setAuth(token, userData, refreshToken);
        setUser(authStore.getUser());
        setIsAuthenticated(true);
    }, []);

    const logout = useCallback(() => {
        authStore.clearAuth();
        setUser(null);
        setIsAuthenticated(false);
    }, []);

    return {
        user,
        isAuthenticated,
        login,
        logout,
        token: authStore.getToken()
    };
};
