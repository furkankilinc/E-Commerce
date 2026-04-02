type Admin = {
    id: string;
    email: string;
    name: string;
    role: string;
};

class AdminAuthStore {
    private accessToken: string | null = typeof window !== 'undefined' ? sessionStorage.getItem('admin_token') : null;
    private refreshToken: string | null = typeof window !== 'undefined' ? sessionStorage.getItem('admin_refresh_token') : null;
    private admin: Admin | null = (() => {
        if (typeof window === 'undefined') return null;
        const stored = sessionStorage.getItem('admin_user');
        if (!stored || stored === 'undefined') return null;
        try {
            return JSON.parse(stored);
        } catch (e) {
            return null;
        }
    })();

    setAuth(accessToken: string, refreshToken: string, admin: Admin) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.admin = admin;
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('admin_token', accessToken);
            sessionStorage.setItem('admin_refresh_token', refreshToken);
            sessionStorage.setItem('admin_user', JSON.stringify(admin));
        }
    }

    setAccessToken(accessToken: string) {
        this.accessToken = accessToken;
        if (typeof window !== 'undefined') sessionStorage.setItem('admin_token', accessToken);
    }

    clearAuth() {
        this.accessToken = null;
        this.refreshToken = null;
        this.admin = null;
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('admin_token');
            sessionStorage.removeItem('admin_refresh_token');
            sessionStorage.removeItem('admin_user');
        }
    }

    getToken() {
        return this.accessToken;
    }

    getRefreshToken() {
        return this.refreshToken;
    }

    getAdmin() {
        return this.admin;
    }

    isAuthenticated() {
        return !!this.accessToken;
    }
}

export const adminAuthStore = new AdminAuthStore();
