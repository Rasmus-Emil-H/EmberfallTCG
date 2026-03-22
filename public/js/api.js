/**
 * Realm Wars API Client
 */

const BASE_URL = '/api';

class ApiClient {
    constructor() {
        this.token = localStorage.getItem('auth_token');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('auth_token', token);
        } else {
            localStorage.removeItem('auth_token');
        }
    }

    async request(method, endpoint, data = null) {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const config = {
            method: method.toUpperCase(),
            headers,
        };

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            config.body = JSON.stringify(data);
        }

        const response = await fetch(`${BASE_URL}${endpoint}`, config);
        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            const error = new Error(result.message || result.error || 'Request failed');
            error.status = response.status;
            error.data = result;
            throw error;
        }

        return result;
    }

    get(endpoint) {
        return this.request('GET', endpoint);
    }

    post(endpoint, data) {
        return this.request('POST', endpoint, data);
    }

    put(endpoint, data) {
        return this.request('PUT', endpoint, data);
    }

    delete(endpoint) {
        return this.request('DELETE', endpoint);
    }

    // ===== Auth =====
    async login(email, password) {
        const data = await this.post('/auth/login', { email, password });
        this.setToken(data.token);
        return data;
    }

    async register(name, email, password, password_confirmation) {
        const data = await this.post('/auth/register', { name, email, password, password_confirmation });
        this.setToken(data.token);
        return data;
    }

    async logout() {
        try {
            await this.post('/auth/logout');
        } catch (e) {
            // ignore
        }
        this.setToken(null);
    }

    getMe() {
        return this.get('/auth/me');
    }

    // ===== Cards =====
    getCards() {
        return this.get('/cards');
    }

    getMyCards() {
        return this.get('/cards/mine');
    }

    // ===== Packs =====
    getPacks() {
        return this.get('/packs');
    }

    openPack(packId) {
        return this.post(`/packs/${packId}/open`);
    }

    // ===== Shop =====
    getShop() {
        return this.get('/shop');
    }

    buyGold() {
        return this.post('/shop/gold');
    }

    // ===== Decks =====
    getDecks() {
        return this.get('/decks');
    }

    createDeck(name, heroClass, cards = []) {
        return this.post('/decks', { name, hero_class: heroClass, cards });
    }

    getDeck(deckId) {
        return this.get(`/decks/${deckId}`);
    }

    updateDeck(deckId, data) {
        return this.put(`/decks/${deckId}`, data);
    }

    deleteDeck(deckId) {
        return this.delete(`/decks/${deckId}`);
    }

    // ===== Game =====
    joinQueue() {
        return this.post('/game/queue');
    }

    getGame(gameId) {
        return this.get(`/game/${gameId}`);
    }

    playCard(gameId, cardId, position = 0) {
        return this.post(`/game/${gameId}/play-card`, { card_id: cardId, position });
    }

    attack(gameId, attackerId, targetId, targetType = 'minion') {
        return this.post(`/game/${gameId}/attack`, {
            attacker_id: attackerId,
            target_id: targetId,
            target_type: targetType
        });
    }

    endTurn(gameId) {
        return this.post(`/game/${gameId}/end-turn`);
    }

    surrender(gameId) {
        return this.post(`/game/${gameId}/surrender`);
    }

    // ===== Stats =====
    getStats() {
        return this.get('/stats');
    }

    // ===== Profile =====
    updateProfile(data) {
        return this.put('/auth/profile', data);
    }
}

const api = new ApiClient();
export default api;
