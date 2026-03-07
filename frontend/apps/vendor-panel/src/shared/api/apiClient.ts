import { authStore } from '../../features/auth/auth.store';

async function refreshToken() {
    const rfToken = authStore.getRefreshToken();
    if (!rfToken) throw new Error('No refresh token');

    const res = await fetch('/api/auth/merchant/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rfToken })
    });

    if (!res.ok) {
        authStore.clearAuth();
        window.location.href = '/login';
        throw new Error('Refresh failed');
    }

    const data = await res.json();
    authStore.setAccessToken(data.accessToken);
    if (data.refreshToken) {
        // Optional: backend might rotate refresh tokens
        // Check if backend returns new rfToken in merchantRefresh
        // Based on merchant.auth.controller.ts, it DOES return new refreshToken
        authStore.setAuth(data.accessToken, data.refreshToken, authStore.getMerchant()!);
    }
    return data.accessToken;
}

export const apiClient = {
    async fetch(url: string, options: RequestInit = {}) {
        let token = authStore.getToken();

        const headers = {
            ...options.headers,
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        } as Record<string, string>;

        let response = await fetch(url, { ...options, headers });

        if (response.status === 401) {
            try {
                const newToken = await refreshToken();
                headers['Authorization'] = `Bearer ${newToken}`;
                response = await fetch(url, { ...options, headers });
            } catch (err) {
                // Refresh failed, exit handled in refreshToken
                return response;
            }
        }

        // Global kick out on 401/403 if not already handled or if refresh failed
        if ((response.status === 401 || response.status === 403) && !window.location.pathname.includes('/login')) {
            authStore.clearAuth();
            window.location.href = '/login';
        }

        return response;
    },

    async get(url: string, options: RequestInit = {}) {
        return this.fetch(url, { ...options, method: 'GET' });
    },

    async post(url: string, body: any, options: RequestInit = {}) {
        const isFormData = body instanceof FormData;
        const headers: any = { ...options.headers };

        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }

        return this.fetch(url, {
            ...options,
            method: 'POST',
            headers,
            body: isFormData ? body : JSON.stringify(body)
        });
    },

    async put(url: string, body: any, options: RequestInit = {}) {
        const isFormData = body instanceof FormData;
        const headers: any = { ...options.headers };

        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }

        return this.fetch(url, {
            ...options,
            method: 'PUT',
            headers,
            body: isFormData ? body : JSON.stringify(body)
        });
    },

    async delete(url: string, options: RequestInit = {}) {
        return this.fetch(url, { ...options, method: 'DELETE' });
    }
};
