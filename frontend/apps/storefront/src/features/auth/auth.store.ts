type User = {
    id: string;
    email: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
};

class AuthStore {
    private accessToken: string | null = localStorage.getItem('token');
    private user: User | null = JSON.parse(localStorage.getItem('user') || 'null');

    setAuth(accessToken: string, user: User) {
        this.accessToken = accessToken;
        this.user = user;
        localStorage.setItem('token', accessToken);
        localStorage.setItem('user', JSON.stringify(user));
    }

    clearAuth() {
        this.accessToken = null;
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    getToken() {
        return this.accessToken;
    }

    getUser() {
        return this.user;
    }

    isAuthenticated() {
        return !!this.accessToken;
    }
}

export const authStore = new AuthStore();
