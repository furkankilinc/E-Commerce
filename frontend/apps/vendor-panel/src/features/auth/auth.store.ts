type Merchant = {
    id: string;
    email: string;
    companyName: string;
    isVerified: boolean;
};

class AuthStore {
    private accessToken: string | null = localStorage.getItem('v_token');
    private refreshToken: string | null = localStorage.getItem('v_ref');
    private merchant: Merchant | null = JSON.parse(localStorage.getItem('v_user') || 'null');

    setAuth(accessToken: string, refreshToken: string, merchant: Merchant) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.merchant = merchant;
        localStorage.setItem('v_token', accessToken);
        localStorage.setItem('v_ref', refreshToken);
        localStorage.setItem('v_user', JSON.stringify(merchant));
    }

    setAccessToken(accessToken: string) {
        this.accessToken = accessToken;
        localStorage.setItem('v_token', accessToken);
    }

    clearAuth() {
        this.accessToken = null;
        this.refreshToken = null;
        this.merchant = null;
        localStorage.removeItem('v_token');
        localStorage.removeItem('v_ref');
        localStorage.removeItem('v_user');
    }

    getToken() {
        return this.accessToken;
    }

    getRefreshToken() {
        return this.refreshToken;
    }

    getMerchant() {
        return this.merchant;
    }

    isAuthenticated() {
        return !!this.accessToken;
    }
}

export const authStore = new AuthStore();

