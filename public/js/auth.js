/**
 * Realm Wars Auth Manager
 */

import api from './api.js';

class AuthManager {
    constructor() {
        this.user = null;
        this._loadUser();
    }

    _loadUser() {
        const stored = localStorage.getItem('realm_user');
        if (stored) {
            try {
                this.user = JSON.parse(stored);
            } catch (e) {
                this.user = null;
            }
        }
    }

    _saveUser(user) {
        this.user = user;
        if (user) {
            localStorage.setItem('realm_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('realm_user');
        }
    }

    async login(email, password) {
        const data = await api.login(email, password);
        this._saveUser(data.user);
        return data;
    }

    async register(name, email, password, passwordConfirmation) {
        const data = await api.register(name, email, password, passwordConfirmation);
        this._saveUser(data.user);
        return data;
    }

    async logout() {
        await api.logout();
        this._saveUser(null);
        api.setToken(null);
    }

    isLoggedIn() {
        return !!api.token;
    }

    getUser() {
        return this.user;
    }

    async refreshUser() {
        try {
            const user = await api.getMe();
            this._saveUser(user);
            return user;
        } catch (e) {
            return this.user;
        }
    }

    updateGold(gold) {
        if (this.user) {
            this.user.gold = gold;
            this._saveUser(this.user);
        }
    }
}

const auth = new AuthManager();
export default auth;
