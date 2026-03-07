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

    setAuth(_accessToken: string, user: User) {
        this.user = user;
        localStorage.setItem('user', JSON.stringify(user));
    }

    clearAuth() {
        this.user = null;
        localStorage.removeItem('user');
    }

    getToken() {
        return null; // Token artık cookielerde
    }

    getUser() {
        return this.user;
    }

    isAuthenticated() {
        return !!this.user;
    }
}

export const authStore = new AuthStore();
