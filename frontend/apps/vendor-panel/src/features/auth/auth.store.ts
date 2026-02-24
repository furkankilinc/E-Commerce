type Merchant = {
    id: string;
    email: string;
    companyName: string;
    isVerified: boolean;
};

class AuthStore {
    private accessToken: string | null = localStorage.getItem('v_token');
    private merchant: Merchant | null = JSON.parse(localStorage.getItem('v_user') || 'null');

    setAuth(accessToken: string, merchant: Merchant) {
        this.accessToken = accessToken;
        this.merchant = merchant;
        localStorage.setItem('v_token', accessToken);
        localStorage.setItem('v_user', JSON.stringify(merchant));
    }

    clearAuth() {
        this.accessToken = null;
        this.merchant = null;
        localStorage.removeItem('v_token');
        localStorage.removeItem('v_ref');
        localStorage.removeItem('v_user');
    }

    getToken() {
        return this.accessToken;
    }

    getMerchant() {
        return this.merchant;
    }

    isAuthenticated() {
        return !!this.accessToken;
    }
}

export const authStore = new AuthStore();
