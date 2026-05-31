type User = {
    id: string;
    email: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
};

class AuthStore {
    private user: User | null = JSON.parse(localStorage.getItem('user') || 'null');
    private token: string | null = localStorage.getItem('access_token');
    private refreshToken: string | null = localStorage.getItem('refresh_token');

    setAuth(accessToken: string, user: User, refreshToken?: string) {
        this.user = user;
        this.token = accessToken;
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('access_token', accessToken);
        if (refreshToken) {
            this.refreshToken = refreshToken;
            localStorage.setItem('refresh_token', refreshToken);
        }
    }

    setAccessToken(accessToken: string) {
        this.token = accessToken;
        localStorage.setItem('access_token', accessToken);
    }

    clearAuth() {
        this.user = null;
        this.token = null;
        this.refreshToken = null;
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    }

    getToken() {
        return this.token;
    }

    getRefreshToken() {
        return this.refreshToken;
    }

    getUser() {
        return this.user;
    }

    isAuthenticated() {
        return !!this.user;
    }
}

export const authStore = new AuthStore();
