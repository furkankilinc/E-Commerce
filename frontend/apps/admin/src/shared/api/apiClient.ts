import { adminAuthStore } from '../../features/auth/admin.store';

async function refreshToken() {
    const rfToken = adminAuthStore.getRefreshToken();
    if (!rfToken) throw new Error('No refresh token');

    const res = await fetch('/api/auth/admin/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rfToken })
    });

    if (!res.ok) {
        adminAuthStore.clearAuth();
        window.location.href = '/login';
        throw new Error('Refresh failed');
    }

    const data = await res.json();
    if (data.accessToken && data.refreshToken) {
        adminAuthStore.setAuth(data.accessToken, data.refreshToken, data.admin || adminAuthStore.getAdmin()!);
    } else if (data.accessToken) {
        adminAuthStore.setAccessToken(data.accessToken);
    }

    return data.accessToken;
}

export const apiClient = {
    async fetch(url: string, options: RequestInit = {}) {
        let token = adminAuthStore.getToken();

        const headers = {
            ...options.headers,
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        } as Record<string, string>;

        let response = await fetch(url, { ...options, headers });

        if (response.status === 401) {
            try {
                const newToken = await refreshToken();
                headers['Authorization'] = `Bearer ${newToken}`;
                // Retry original request
                response = await fetch(url, { ...options, headers });
            } catch (err) {
                // Refresh failed, redirect handled in refreshToken
                return response;
            }
        }

        // If it's still 401 or 403, and we are not on login page, redirect
        if ((response.status === 401 || response.status === 403) && !window.location.pathname.includes('/login')) {
            adminAuthStore.clearAuth();
            window.location.href = '/login';
        }

        return response;
    },

    async handleResponse(response: Response) {
        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || `Request failed with status ${response.status}`);
        }
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return response.json();
        }
        return response.text();
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

    async patch(url: string, body: any, options: RequestInit = {}) {
        const isFormData = body instanceof FormData;
        const headers: any = { ...options.headers };

        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }

        return this.fetch(url, {
            ...options,
            method: 'PATCH',
            headers,
            body: isFormData ? body : JSON.stringify(body)
        });
    },

    async delete(url: string, options: RequestInit = {}) {
        return this.fetch(url, { ...options, method: 'DELETE' });
    }
};
