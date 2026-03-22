/**
 * Realm Wars - Main App Entry Point
 */

import api from './api.js';
import auth from './auth.js';
import ui from './ui.js';
import { PackOpeningScene } from './three-cards.js';
import { GameManager } from './game.js';

class RealmWarsApp {
    constructor() {
        this.packOpeningScene = null;
        this.gameManager = null;
        this.currentPackId = null;
        this.allCards = [];
        this.myCards = [];
        this.currentDeck = { name: '', hero_class: 'warrior', cards: [] };
        this.deckBuilderCards = [];

        this._init();
    }

    _init() {
        // Apply saved theme preference
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.dataset.theme = savedTheme;

        // Setup nav link clicks
        document.querySelectorAll('.nav-links a[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.hash = '#' + link.dataset.page;
            });
        });

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this._logout());
        }

        // Route handler
        window.addEventListener('hashchange', () => this._route());

        // Initial route
        this._route();
    }

    async _route() {
        const hash = window.location.hash || '#home';
        const page = hash.replace('#', '');

        // Fullscreen game mode — hide nav, remove margin
        document.body.classList.toggle('game-mode', page === 'game');

        // Destroy previous scenes
        if (page !== 'open-packs' && this.packOpeningScene) {
            this.packOpeningScene.destroy();
            this.packOpeningScene = null;
        }
        if (page !== 'game' && this.gameManager) {
            this.gameManager.destroy();
            this.gameManager = null;
        }

        // Auth guard
        const publicPages = ['login', 'register'];
        if (!auth.isLoggedIn() && !publicPages.includes(page)) {
            window.location.hash = '#login';
            return;
        }

        if (auth.isLoggedIn() && publicPages.includes(page)) {
            window.location.hash = '#home';
            return;
        }

        ui.setNavVisibility(auth.isLoggedIn());

        switch (page) {
            case 'login': this._renderLogin(); break;
            case 'register': this._renderRegister(); break;
            case 'home': await this._renderHome(); break;
            case 'shop': await this._renderShop(); break;
            case 'collection': await this._renderCollection(); break;
            case 'open-packs': await this._renderPackOpening(); break;
            case 'game': await this._renderGame(); break;
            case 'deck-builder': await this._renderDeckBuilder(); break;
            case 'decks': await this._renderDecks(); break;
            case 'stats': await this._renderStats(); break;
            case 'options': await this._renderOptions(); break;
            default: await this._renderHome(); break;
        }
    }

    // ===== AUTH PAGES =====

    _renderLogin() {
        ui.showPage('login');
        const form = document.getElementById('login-form');
        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;
                const btn = form.querySelector('.btn-primary');
                btn.disabled = true;
                btn.textContent = 'Logging in...';

                try {
                    await auth.login(email, password);
                    ui.showNotification('Welcome back, Champion!', 'success');
                    window.location.hash = '#home';
                } catch (err) {
                    const msg = err.data?.errors?.email?.[0] || err.message;
                    ui.showNotification(msg, 'error');
                } finally {
                    btn.disabled = false;
                    btn.textContent = 'Enter the Realm';
                }
            };
        }
    }

    _renderRegister() {
        ui.showPage('register');
        const form = document.getElementById('register-form');
        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                const name = document.getElementById('reg-name').value;
                const email = document.getElementById('reg-email').value;
                const password = document.getElementById('reg-password').value;
                const confirm = document.getElementById('reg-password-confirm').value;
                const btn = form.querySelector('.btn-primary');

                if (password !== confirm) {
                    ui.showNotification('Passwords do not match!', 'error');
                    return;
                }

                btn.disabled = true;
                btn.textContent = 'Creating account...';

                try {
                    await auth.register(name, email, password, confirm);
                    ui.showNotification('Welcome to Realm Wars, ' + name + '!', 'success');
                    window.location.hash = '#home';
                } catch (err) {
                    const errors = err.data?.errors;
                    const msg = errors
                        ? Object.values(errors).flat().join(', ')
                        : err.message;
                    ui.showNotification(msg, 'error');
                } finally {
                    btn.disabled = false;
                    btn.textContent = 'Join the Realm';
                }
            };
        }
    }

    async _logout() {
        await auth.logout();
        ui.setNavVisibility(false);
        ui.showNotification('See you next battle!', 'info');
        window.location.hash = '#login';
    }

    // ===== HOME =====

    async _renderHome() {
        ui.showPage('home');

        try {
            const user = await auth.refreshUser();
            ui.updateGoldDisplay(user.gold);

            document.getElementById('welcome-name').textContent = user.name;
            document.getElementById('home-gold').textContent = user.gold.toLocaleString();

            // Get collection count
            try {
                const myCards = await api.getMyCards();
                document.getElementById('home-cards').textContent = myCards.length;
            } catch (e) {
                document.getElementById('home-cards').textContent = '0';
            }

            // Get decks count
            try {
                const decks = await api.getDecks();
                document.getElementById('home-decks').textContent = decks.length;
            } catch (e) {
                document.getElementById('home-decks').textContent = '0';
            }
        } catch (err) {
            // Non-critical
        }
    }

    // ===== SHOP =====

    async _renderShop() {
        ui.showPage('shop');
        ui.showLoadingSpinner('Loading shop...');

        try {
            const [packs, user] = await Promise.all([api.getShop(), auth.refreshUser()]);
            ui.hideLoadingSpinner();
            ui.updateGoldDisplay(user.gold);

            const container = document.getElementById('shop-packs-grid');
            if (container) {
                ui.renderShop(container, packs, {
                    onBuy: (pack) => this._buyPack(pack),
                });
            }
        } catch (err) {
            ui.hideLoadingSpinner();
            ui.showNotification('Failed to load shop: ' + err.message, 'error');
        }
    }

    async _buyPack(pack) {
        const user = auth.getUser();
        if (user && user.gold < pack.price) {
            ui.showNotification(`Not enough gold! Need ${pack.price}, have ${user.gold}.`, 'warning');
            return;
        }

        // Navigate to pack opening with this pack selected
        this.currentPackId = pack.id;
        window.location.hash = '#open-packs';
    }

    // ===== COLLECTION =====

    async _renderCollection() {
        ui.showPage('collection');
        ui.showLoadingSpinner('Loading collection...');

        try {
            const [myCards, user] = await Promise.all([api.getMyCards(), auth.refreshUser()]);
            ui.hideLoadingSpinner();
            ui.updateGoldDisplay(user.gold);

            this.myCards = myCards;

            const container = document.getElementById('collection-cards-grid');
            let currentFilter = 'all';
            let currentClass = 'all';

            const renderFiltered = () => {
                let filtered = myCards;
                if (currentFilter !== 'all') {
                    filtered = filtered.filter(c => c.rarity === currentFilter);
                }
                if (currentClass !== 'all') {
                    filtered = filtered.filter(c => c.hero_class === currentClass);
                }
                ui.renderCards(container, filtered, {
                    onClick: (card) => {
                        ui.showNotification(`${card.name} - ${card.description || 'No description.'}`, 'info', 3000);
                    },
                });
                document.getElementById('collection-count').textContent = filtered.length;
            };

            renderFiltered();

            // Filter buttons
            document.querySelectorAll('.collection-filter-rarity').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.collection-filter-rarity').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    currentFilter = btn.dataset.rarity;
                    renderFiltered();
                });
            });

            document.querySelectorAll('.collection-filter-class').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.collection-filter-class').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    currentClass = btn.dataset.class;
                    renderFiltered();
                });
            });

        } catch (err) {
            ui.hideLoadingSpinner();
            ui.showNotification('Failed to load collection: ' + err.message, 'error');
        }
    }

    // ===== PACK OPENING =====

    async _renderPackOpening() {
        ui.showPage('open-packs');

        try {
            const [packs, user] = await Promise.all([api.getPacks(), auth.refreshUser()]);
            ui.updateGoldDisplay(user.gold);

            const packSelection = document.getElementById('pack-selection-grid');
            if (packSelection) {
                packSelection.innerHTML = '';
                packs.forEach(pack => {
                    const div = document.createElement('div');
                    div.className = 'pack-option';
                    if (this.currentPackId && pack.id == this.currentPackId) {
                        div.classList.add('selected');
                    }
                    let emoji = '📦';
                    if (pack.name.toLowerCase().includes('arcane')) emoji = '🔮';
                    if (pack.name.toLowerCase().includes('legendary')) emoji = '✨';

                    div.innerHTML = `
                        <div class="pack-emoji">${emoji}</div>
                        <div class="pack-option-name">${pack.name}</div>
                        <div class="pack-option-price">${pack.price} Gold</div>
                    `;
                    div.addEventListener('click', () => {
                        document.querySelectorAll('.pack-option').forEach(p => p.classList.remove('selected'));
                        div.classList.add('selected');
                        this.currentPackId = pack.id;
                    });
                    packSelection.appendChild(div);
                });
            }

            // Open pack button
            const openBtn = document.getElementById('pack-open-btn');
            if (openBtn) {
                openBtn.onclick = () => this._openSelectedPack(packs);
            }

        } catch (err) {
            ui.showNotification('Failed to load packs: ' + err.message, 'error');
        }
    }

    async _openSelectedPack(packs) {
        if (!this.currentPackId) {
            ui.showNotification('Please select a pack first!', 'warning');
            return;
        }

        const pack = packs.find(p => p.id == this.currentPackId);
        const user = auth.getUser();
        if (user && user.gold < pack.price) {
            ui.showNotification(`Not enough gold! Need ${pack.price}, have ${user.gold}.`, 'warning');
            return;
        }

        const openBtn = document.getElementById('pack-open-btn');
        openBtn.disabled = true;
        openBtn.textContent = 'Opening...';

        try {
            const result = await api.openPack(this.currentPackId);

            // Update gold
            auth.updateGold(result.gold_remaining);
            ui.updateGoldDisplay(result.gold_remaining);

            // Show 3D pack opening
            const container = document.getElementById('three-pack-container');
            container.style.display = 'block';

            // Destroy previous scene if any
            if (this.packOpeningScene) {
                this.packOpeningScene.destroy();
            }

            const packType = pack.name.toLowerCase().includes('legendary') ? 'legendary' :
                             pack.name.toLowerCase().includes('arcane') ? 'arcane' : 'starter';

            this.packOpeningScene = new PackOpeningScene(container);
            this.packOpeningScene.loadCards(result.cards, packType);

            // Start reveal animation
            await this.packOpeningScene.animatePackReveal();

            // Show revealed cards below
            const revealedContainer = document.getElementById('revealed-cards');
            if (revealedContainer) {
                revealedContainer.innerHTML = '';
                result.cards.forEach(card => {
                    const el = ui.createCardElement(card);
                    revealedContainer.appendChild(el);
                });
            }

            ui.showNotification(`You opened ${result.cards.length} cards!`, 'success');

        } catch (err) {
            const msg = err.data?.error || err.message;
            ui.showNotification(msg, 'error');
        } finally {
            openBtn.disabled = false;
            openBtn.textContent = 'Open Pack';
        }
    }

    // ===== GAME =====

    async _renderGame() {
        ui.showPage('game');

        const user = await auth.refreshUser();
        ui.updateGoldDisplay(user.gold);

        const playerNameEl = document.getElementById('player-name-display');
        if (playerNameEl) playerNameEl.textContent = user.name;

        // Wire buttons (game.js owns the logic)
        document.getElementById('end-turn-btn').onclick   = () => this.gameManager?.handleEndTurn();
        document.getElementById('surrender-btn').onclick  = () => this.gameManager?.handleSurrender();

        if (this.gameManager) {
            this.gameManager.destroy();
            this.gameManager = null;
        }

        const canvas = document.getElementById('game-canvas-container');
        this.gameManager = new GameManager();
        // game.js owns showing/hiding the matchmaking overlay and #game-active
        this.gameManager.startMatchmaking(canvas, user.id);
    }

    // ===== DECKS =====

    async _renderDecks() {
        ui.showPage('decks');
        ui.showLoadingSpinner('Loading decks...');

        try {
            const decks = await api.getDecks();
            ui.hideLoadingSpinner();

            const container = document.getElementById('decks-list-grid');
            if (container) {
                container.innerHTML = '';
                if (decks.length === 0) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-icon">📋</div>
                            <h3>No Decks Yet</h3>
                            <p>Create your first deck to start battling!</p>
                            <button class="btn btn-primary mt-20" onclick="window.location.hash='#deck-builder'">Create Deck</button>
                        </div>
                    `;
                } else {
                    decks.forEach(deck => {
                        const div = document.createElement('div');
                        div.className = 'deck-item';
                        const cardCount = deck.cards?.reduce((sum, c) => sum + (c.pivot?.quantity || 1), 0) || 0;
                        div.innerHTML = `
                            <div class="deck-item-header">
                                <div>
                                    <h3>${deck.name}</h3>
                                    <div class="deck-item-class class-${deck.hero_class}">${deck.hero_class}</div>
                                </div>
                                <div class="deck-item-count">${cardCount} cards</div>
                            </div>
                            <div style="display:flex;gap:10px;margin-top:15px;">
                                <button class="btn btn-secondary btn-sm" data-deck-id="${deck.id}">Edit</button>
                                <button class="btn btn-danger btn-sm" data-delete-id="${deck.id}">Delete</button>
                            </div>
                        `;
                        div.querySelector('[data-deck-id]').addEventListener('click', () => {
                            window.location.hash = '#deck-builder';
                            // TODO: load deck for editing
                        });
                        div.querySelector('[data-delete-id]').addEventListener('click', async () => {
                            if (confirm('Delete this deck?')) {
                                try {
                                    await api.deleteDeck(deck.id);
                                    ui.showNotification('Deck deleted.', 'success');
                                    this._renderDecks();
                                } catch (e) {
                                    ui.showNotification('Failed to delete deck.', 'error');
                                }
                            }
                        });
                        container.appendChild(div);
                    });
                }
            }
        } catch (err) {
            ui.hideLoadingSpinner();
            ui.showNotification('Failed to load decks: ' + err.message, 'error');
        }
    }

    // ===== DECK BUILDER =====

    async _renderDeckBuilder() {
        ui.showPage('deck-builder');
        ui.showLoadingSpinner('Loading deck builder...');

        try {
            const [allCards, myCards, user] = await Promise.all([
                api.getCards(),
                api.getMyCards(),
                auth.refreshUser(),
            ]);
            ui.hideLoadingSpinner();
            ui.updateGoldDisplay(user.gold);

            this.allCards = allCards;
            this.myCards = myCards;
            this.currentDeck = { name: 'My New Deck', hero_class: 'warrior', cards: [] };

            const myCardIds = new Set(myCards.map(c => c.id));
            const deckCardsContainer = document.getElementById('deck-builder-cards-grid');
            const deckListContainer = document.getElementById('deck-card-list');

            let filterClass = 'all';
            let filterRarity = 'all';

            const renderDeckBuilderCards = () => {
                if (!deckCardsContainer) return;
                deckCardsContainer.innerHTML = '';

                let filtered = allCards.filter(c => {
                    const classMatch = filterClass === 'all' || c.hero_class === filterClass || c.hero_class === 'neutral';
                    const rarityMatch = filterRarity === 'all' || c.rarity === filterRarity;
                    return classMatch && rarityMatch;
                });

                filtered.forEach(card => {
                    const owned = myCardIds.has(card.id);
                    const el = ui.createCardElement(card);
                    if (!owned) {
                        el.style.opacity = '0.5';
                    }
                    el.addEventListener('click', () => {
                        this._addCardToDeck(card);
                        renderDeckList();
                    });
                    deckCardsContainer.appendChild(el);
                });
            };

            const renderDeckList = () => {
                if (!deckListContainer) return;
                deckListContainer.innerHTML = '';

                const countEl = document.getElementById('deck-card-count');
                const total = this.currentDeck.cards.reduce((s, c) => s + c.quantity, 0);
                if (countEl) countEl.innerHTML = `<span>${total}</span> / 30 cards`;

                const sorted = [...this.currentDeck.cards].sort((a, b) => a.card.mana_cost - b.card.mana_cost);
                sorted.forEach(entry => {
                    const item = document.createElement('div');
                    item.className = 'deck-card-item';
                    item.innerHTML = `
                        <div class="item-mana">${entry.card.mana_cost}</div>
                        <div class="item-name">${entry.card.name}</div>
                        <div class="item-qty">x${entry.quantity}</div>
                    `;
                    item.addEventListener('click', () => {
                        this._removeCardFromDeck(entry.card.id);
                        renderDeckList();
                    });
                    deckListContainer.appendChild(item);
                });
            };

            // Class filter buttons
            document.querySelectorAll('.deck-filter-class').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.deck-filter-class').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    filterClass = btn.dataset.class;
                    renderDeckBuilderCards();
                });
            });

            // Save deck button
            const saveDeckBtn = document.getElementById('save-deck-btn');
            if (saveDeckBtn) {
                saveDeckBtn.onclick = () => this._saveDeck();
            }

            // Deck name input
            const deckNameInput = document.getElementById('deck-name-input');
            if (deckNameInput) {
                deckNameInput.value = this.currentDeck.name;
                deckNameInput.addEventListener('input', () => {
                    this.currentDeck.name = deckNameInput.value;
                });
            }

            renderDeckBuilderCards();
            renderDeckList();

        } catch (err) {
            ui.hideLoadingSpinner();
            ui.showNotification('Failed to load deck builder: ' + err.message, 'error');
        }
    }

    _addCardToDeck(card) {
        const existing = this.currentDeck.cards.find(c => c.card.id === card.id);
        const total = this.currentDeck.cards.reduce((s, c) => s + c.quantity, 0);

        if (total >= 30) {
            ui.showNotification('Deck is full! (30 cards max)', 'warning');
            return;
        }

        if (existing) {
            if (existing.quantity >= 2) {
                ui.showNotification('You can only have 2 copies of a card in a deck.', 'warning');
                return;
            }
            existing.quantity++;
        } else {
            this.currentDeck.cards.push({ card, quantity: 1 });
        }
    }

    _removeCardFromDeck(cardId) {
        const existing = this.currentDeck.cards.find(c => c.card.id === cardId);
        if (!existing) return;
        if (existing.quantity > 1) {
            existing.quantity--;
        } else {
            this.currentDeck.cards = this.currentDeck.cards.filter(c => c.card.id !== cardId);
        }
    }

    // ===== STATS =====

    async _renderStats() {
        ui.showPage('stats');
        ui.showLoadingSpinner('Loading stats...');

        const CLASS_EMOJI = { warrior:'⚔️', mage:'🔮', ranger:'🏹', paladin:'🛡️', druid:'🌿', neutral:'⭐' };

        try {
            const s = await api.getStats();
            ui.hideLoadingSpinner();

            // Overview
            document.getElementById('stat-games').textContent       = s.games_played;
            document.getElementById('stat-wins').textContent        = s.wins;
            document.getElementById('stat-losses').textContent      = s.losses;
            document.getElementById('stat-winrate').textContent     = s.games_played > 0 ? s.win_rate + '%' : '—';
            document.getElementById('stat-turns').textContent       = s.games_played > 0 ? s.avg_turns : '—';
            document.getElementById('stat-cards-played').textContent = s.total_cards_played;

            // Streak
            const streakEl = document.getElementById('stats-streak');
            if (s.streak > 0 && s.streak_type) {
                const isWin = s.streak_type === 'win';
                streakEl.innerHTML = `
                    <div class="streak-display streak-display--${s.streak_type}">
                        <div class="streak-num">${s.streak}</div>
                        <div class="streak-label">${isWin ? '🔥 Win' : '❄️ Loss'} Streak</div>
                    </div>`;
            } else {
                streakEl.innerHTML = `<div class="stats-empty">No games yet</div>`;
            }

            // Top cards
            const topEl = document.getElementById('stats-top-cards');
            if (s.top_cards.length) {
                topEl.innerHTML = s.top_cards.map((c, i) => `
                    <div class="top-card-row">
                        <div class="top-card-rank">#${i+1}</div>
                        <div class="top-card-icon">${CLASS_EMOJI[c.hero_class] || '⭐'}</div>
                        <div class="top-card-info">
                            <div class="top-card-name">${c.name}</div>
                            <div class="top-card-meta">${c.hero_class} · ${c.rarity}</div>
                        </div>
                        <div class="top-card-count">${c.play_count}×</div>
                    </div>`).join('');
            } else {
                topEl.innerHTML = `<div class="stats-empty">No cards played yet</div>`;
            }

            // Class breakdown
            const classEl = document.getElementById('stats-class-breakdown');
            if (s.class_breakdown.length) {
                const max = s.class_breakdown[0].total;
                classEl.innerHTML = s.class_breakdown.map(c => `
                    <div class="class-bar-row">
                        <div class="class-bar-label">${CLASS_EMOJI[c.hero_class] || '⭐'} ${c.hero_class}</div>
                        <div class="class-bar-track">
                            <div class="class-bar-fill" style="width:${Math.round((c.total/max)*100)}%"></div>
                        </div>
                        <div class="class-bar-count">${c.total}</div>
                    </div>`).join('');
            } else {
                classEl.innerHTML = `<div class="stats-empty">No data yet</div>`;
            }

            // Recent games
            const recentEl = document.getElementById('stats-recent-games');
            if (s.recent_games.length) {
                recentEl.innerHTML = s.recent_games.map(g => `
                    <div class="recent-game-row ${g.won ? 'recent-win' : 'recent-loss'}">
                        <div class="rg-result">${g.won ? '🏆' : '💀'}</div>
                        <div class="rg-info">
                            <div class="rg-opponent">vs ${g.opponent}</div>
                            <div class="rg-meta">${g.turns} turns · ${new Date(g.played_at).toLocaleDateString()}</div>
                        </div>
                        <div class="rg-badge ${g.won ? 'rg-badge--win' : 'rg-badge--loss'}">${g.won ? 'WIN' : 'LOSS'}</div>
                    </div>`).join('');
            } else {
                recentEl.innerHTML = `<div class="stats-empty">No games played yet</div>`;
            }

        } catch (err) {
            ui.hideLoadingSpinner();
            ui.showNotification('Failed to load stats: ' + err.message, 'error');
        }
    }

    // ===== OPTIONS =====

    async _renderOptions() {
        ui.showPage('options');

        try {
            const user = await auth.refreshUser();

            // Pre-fill profile form
            const nameEl  = document.getElementById('options-name');
            const emailEl = document.getElementById('options-email');
            if (nameEl)  nameEl.value  = user.name  || '';
            if (emailEl) emailEl.value = user.email || '';

            // Theme buttons
            const currentTheme = document.documentElement.dataset.theme || 'dark';
            document.querySelectorAll('.theme-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.theme === currentTheme);
                btn.addEventListener('click', () => {
                    const t = btn.dataset.theme;
                    document.documentElement.dataset.theme = t;
                    localStorage.setItem('theme', t);
                    document.querySelectorAll('.theme-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === t));
                });
            });

            // Profile form
            const profileForm = document.getElementById('profile-form');
            if (profileForm) {
                profileForm.onsubmit = async (e) => {
                    e.preventDefault();
                    const btn = profileForm.querySelector('button[type=submit]');
                    btn.disabled = true;
                    btn.textContent = 'Saving...';
                    try {
                        const updated = await api.updateProfile({
                            name:  document.getElementById('options-name').value,
                            email: document.getElementById('options-email').value,
                        });
                        auth.user = updated;
                        ui.showNotification('Profile updated!', 'success');
                    } catch (err) {
                        ui.showNotification(err.data?.error || err.message, 'error');
                    } finally {
                        btn.disabled = false;
                        btn.textContent = 'Save Changes';
                    }
                };
            }

            // Password form
            const pwForm = document.getElementById('password-form');
            if (pwForm) {
                pwForm.onsubmit = async (e) => {
                    e.preventDefault();
                    const newPw  = document.getElementById('options-new-pw').value;
                    const confPw = document.getElementById('options-confirm-pw').value;
                    if (newPw !== confPw) {
                        ui.showNotification('Passwords do not match!', 'error');
                        return;
                    }
                    const btn = pwForm.querySelector('button[type=submit]');
                    btn.disabled = true;
                    btn.textContent = 'Updating...';
                    try {
                        await api.updateProfile({
                            current_password:      document.getElementById('options-current-pw').value,
                            password:              newPw,
                            password_confirmation: confPw,
                        });
                        pwForm.reset();
                        ui.showNotification('Password updated!', 'success');
                    } catch (err) {
                        ui.showNotification(err.data?.error || err.message, 'error');
                    } finally {
                        btn.disabled = false;
                        btn.textContent = 'Update Password';
                    }
                };
            }

        } catch (err) {
            ui.showNotification('Failed to load settings: ' + err.message, 'error');
        }
    }

    async _saveDeck() {
        const name = this.currentDeck.name || 'My Deck';
        const heroClass = document.getElementById('deck-hero-class')?.value || 'warrior';
        const cards = this.currentDeck.cards.map(c => ({
            card_id: c.card.id,
            quantity: c.quantity,
        }));

        if (cards.length === 0) {
            ui.showNotification('Add some cards to your deck first!', 'warning');
            return;
        }

        try {
            ui.showLoadingSpinner('Saving deck...');
            await api.createDeck(name, heroClass, cards);
            ui.hideLoadingSpinner();
            ui.showNotification('Deck saved successfully!', 'success');
            window.location.hash = '#decks';
        } catch (err) {
            ui.hideLoadingSpinner();
            ui.showNotification('Failed to save deck: ' + err.message, 'error');
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window._app = new RealmWarsApp();
});
