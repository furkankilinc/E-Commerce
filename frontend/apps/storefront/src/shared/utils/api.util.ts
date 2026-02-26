import { authStore } from '../../features/auth/auth.store';

/**
 * Custom fetch wrapper that adds Authorization header automatically
 */
export const apiFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const token = authStore.getToken();
    const headers: Record<string, string> = {
        ...((init?.headers as Record<string, string>) || {})
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return fetch(input, {
        ...init,
        headers
    });
};
