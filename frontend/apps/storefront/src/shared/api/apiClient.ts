import { authStore } from '../../features/auth/auth.store';

async function refreshUserToken() {
    const rfToken = authStore.getRefreshToken();
    if (!rfToken) throw new Error('No refresh token');

    const res = await fetch('/api/auth/user/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rfToken }),
        credentials: 'include'
    });

    if (!res.ok) {
        authStore.clearAuth();
        window.location.href = '/login';
        throw new Error('Refresh failed');
    }

    const data = await res.json();
    authStore.setAccessToken(data.accessToken);
    if (data.refreshToken) {
        authStore.setAuth(data.accessToken, data.user, data.refreshToken);
    }
    return data.accessToken;
}

/**
 * Gelişmiş Fetch Wrapper - Otomatik Auth Token ve JSON Yönetimi
 */
export const apiClient = async (path: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers);

    if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
        headers.set('Content-Type', 'application/json');
    }

    let token = authStore.getToken();
    if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    let response = await fetch(path, {
        ...options,
        headers,
        credentials: 'include'
    });

    if (response.status === 401 && !path.includes('/api/auth/user/login') && !path.includes('/api/auth/user/refresh')) {
        try {
            const newToken = await refreshUserToken();
            headers.set('Authorization', `Bearer ${newToken}`);
            response = await fetch(path, {
                ...options,
                headers,
                credentials: 'include'
            });
        } catch (err) {
            // refreshUserToken handles logout and redirect
            return response;
        }
    }

    return response;
};
