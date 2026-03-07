type Merchant = {
    id: string;
    email: string;
    companyName: string;
    isVerified: boolean;
};

class AuthStore {
    private accessToken: string | null = sessionStorage.getItem('v_token');
    private refreshToken: string | null = sessionStorage.getItem('v_ref');
    private merchant: Merchant | null = JSON.parse(sessionStorage.getItem('v_user') || 'null');

    setAuth(accessToken: string, refreshToken: string, merchant: Merchant) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.merchant = merchant;
        sessionStorage.setItem('v_token', accessToken);
        sessionStorage.setItem('v_ref', refreshToken);
        sessionStorage.setItem('v_user', JSON.stringify(merchant));
    }

    setAccessToken(accessToken: string) {
        this.accessToken = accessToken;
        sessionStorage.setItem('v_token', accessToken);
    }

    clearAuth() {
        this.accessToken = null;
        this.refreshToken = null;
        this.merchant = null;
        sessionStorage.removeItem('v_token');
        sessionStorage.removeItem('v_ref');
        sessionStorage.removeItem('v_user');
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

