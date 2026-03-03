type Admin = {
    id: string;
    email: string;
    name: string;
    role: string;
};

class AdminAuthStore {
    private accessToken: string | null = sessionStorage.getItem('admin_token');
    private refreshToken: string | null = sessionStorage.getItem('admin_refresh_token');
    private admin: Admin | null = JSON.parse(sessionStorage.getItem('admin_user') || 'null');

    setAuth(accessToken: string, refreshToken: string, admin: Admin) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.admin = admin;
        sessionStorage.setItem('admin_token', accessToken);
        sessionStorage.setItem('admin_refresh_token', refreshToken);
        sessionStorage.setItem('admin_user', JSON.stringify(admin));
    }

    setAccessToken(accessToken: string) {
        this.accessToken = accessToken;
        sessionStorage.setItem('admin_token', accessToken);
    }

    clearAuth() {
        this.accessToken = null;
        this.refreshToken = null;
        this.admin = null;
        sessionStorage.removeItem('admin_token');
        sessionStorage.removeItem('admin_refresh_token');
        sessionStorage.removeItem('admin_user');
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
