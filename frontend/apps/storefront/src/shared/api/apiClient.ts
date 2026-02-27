import { authStore } from '../../features/auth/auth.store';

/**
 * Gelişmiş Fetch Wrapper - Otomatik Auth Token ve JSON Yönetimi
 */
export const apiClient = async (path: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers);

    if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
        headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(path, {
        ...options,
        headers,
        credentials: 'include' // HttpOnly cookie'lerin gönderilmesi için gerekli
    });

    if (response.status === 401) {
        // Token geçersizse çıkış yap (Veya refresh token mantığı eklenebilir)
        authStore.clearAuth();
        // window.location.href = '/login'; 
    }

    return response;
};
