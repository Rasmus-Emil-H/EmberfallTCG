/**
 * Realm Wars - Main App Entry Point
 */

import api from './api.js';
import auth from './auth.js';
import ui from './ui.js';
import { GameManager } from './game.js';

const POC_CLASS_GRAD = {
    warrior: 'linear-gradient(160deg,#7f1d1d,#b45309)',
    mage:    'linear-gradient(160deg,#1e3a5f,#4c1d95)',
    ranger:  'linear-gradient(160deg,#14532d,#065f46)',
    paladin: 'linear-gradient(160deg,#78350f,#92400e)',
    druid:   'linear-gradient(160deg,#14532d,#1a2e05)',
    neutral: 'linear-gradient(160deg,#1f2937,#374151)',
};
const POC_CLASS_EMOJI  = { warrior:'⚔️', mage:'🔮', ranger:'🏹', paladin:'🛡️', druid:'🌿', neutral:'⭐' };
const POC_RARITY_COLOR = { common:'#6b7280', rare:'#3b82f6', epic:'#a855f7', legendary:'#f59e0b' };

class PackOpener {
    constructor() {
        this._revealedCount = 0;
        this._totalCards    = 0;
        this._bound         = false;
    }

    _bind() {
        if (this._bound) return;
        this._bound = true;
        document.getElementById('pac-close').addEventListener('click', () => this.close());
        document.getElementById('pac-collect-btn').addEventListener('click', () => this.close());
    }

    show(cards, pack) {
        this._bind();
        this._revealedCount = 0;
        this._totalCards    = cards.length;

        /* determine pack type */
        const name = (pack.name || '').toLowerCase();
        const type = name.includes('legendary') ? 'legendary'
                   : name.includes('arcane')    ? 'arcane'
                   : 'starter';

        /* configure pack visual */
        const symbols = { legendary:'✨', arcane:'🔮', starter:'📦' };
        document.getElementById('pac-pack-symbol').textContent = symbols[type];
        document.getElementById('pac-pack-name').textContent   = pack.name;
        document.getElementById('pac-bg-glow').dataset.type    = type;
        document.getElementById('pac-pack').dataset.type       = type;

        /* reset stages */
        const stageCards = document.getElementById('pac-stage-cards');
        stageCards.classList.add('pac-stage--hidden');
        stageCards.style.display = '';
        document.getElementById('pac-stage-pack').classList.remove('pac-stage--hidden');

        const packEl = document.getElementById('pac-pack');
        packEl.classList.remove('pac-pack--bursting');
        packEl.style.display = '';

        document.getElementById('pac-collect-btn').style.display = 'none';
        document.getElementById('pac-cards-hint').style.opacity  = '1';

        /* store cards for reveal */
        this._cards = cards;

        /* wire pack click */
        packEl.onclick = () => this._burstOpen();

        /* show overlay */
        const overlay = document.getElementById('pack-overlay');
        overlay.style.display = 'flex';
        requestAnimationFrame(() => overlay.classList.add('active'));
    }

    async _burstOpen() {
        const packEl  = document.getElementById('pac-pack');
        const wrapEl  = document.getElementById('pac-pack-wrap');
        packEl.onclick = null;

        packEl.classList.add('pac-pack--bursting');
        wrapEl.classList.add('pac-wrap--flash');

        await this._sleep(550);

        document.getElementById('pac-stage-pack').classList.add('pac-stage--hidden');

        const stageCards = document.getElementById('pac-stage-cards');
        stageCards.classList.remove('pac-stage--hidden');

        this._buildCards(this._cards);
    }

    _buildCards(cards) {
        const row = document.getElementById('pac-cards-row');
        row.innerHTML = '';

        cards.forEach((card, i) => {
            const el = this._makeFlipCard(card, i);
            row.appendChild(el);
        });

        document.getElementById('pac-collect-btn').style.display = 'none';
        document.getElementById('pac-cards-hint').textContent    = 'Click each card to reveal';
        document.getElementById('pac-cards-hint').style.opacity  = '1';
    }

    _makeFlipCard(card, index) {
        const cls    = (card.hero_class || 'neutral').toLowerCase();
        const rarity = card.rarity || 'common';

        const el = document.createElement('div');
        el.className         = `poc-card poc-card--${rarity}`;
        el.dataset.index     = index;
        el.style.animationDelay = `${index * 100}ms`;
        el.classList.add('poc-fly-in');

        el.innerHTML = `
            <div class="poc-inner">
                <div class="poc-front" style="--class-grad:${POC_CLASS_GRAD[cls]||POC_CLASS_GRAD.neutral};--rarity-color:${POC_RARITY_COLOR[rarity]||'#6b7280'}">
                    <div class="poc-mana">${card.mana_cost}</div>
                    <div class="poc-art">${POC_CLASS_EMOJI[cls]||'⭐'}</div>
                    <div class="poc-name">${card.name}</div>
                    <div class="poc-type">${card.rarity} · ${card.card_type}</div>
                    <div class="poc-desc">${(card.description||'').slice(0,65)}</div>
                    ${card.card_type !== 'spell'
                        ? `<div class="poc-stats"><span class="poc-atk">⚔ ${card.attack??0}</span><span class="poc-hp">♥ ${card.health??0}</span></div>`
                        : `<div class="poc-spell-badge">✦ SPELL</div>`}
                </div>
                <div class="poc-back">
                    <div class="poc-back-emblem">⚔</div>
                    <div class="poc-back-title">REALM WARS</div>
                </div>
            </div>`;

        el.addEventListener('click', () => this._revealCard(el, card));
        return el;
    }

    async _revealCard(el, card) {
        if (el.classList.contains('poc-revealed') || el.classList.contains('poc-revealing')) return;
        el.classList.add('poc-revealing');
        el.classList.add('poc-revealed');
        await this._sleep(320);
        this._spawnBurst(el, card.rarity);
        el.classList.remove('poc-revealing');
        this._revealedCount++;
        if (this._revealedCount >= this._totalCards) {
            await this._sleep(400);
            document.getElementById('pac-cards-hint').style.opacity = '0';
            const btn = document.getElementById('pac-collect-btn');
            btn.style.display = 'inline-block';
        }
    }

    _spawnBurst(cardEl, rarity) {
        const color = POC_RARITY_COLOR[rarity] || '#9ca3af';
        const count = rarity === 'legendary' ? 28 : rarity === 'epic' ? 18 : rarity === 'rare' ? 14 : 8;
        const rect  = cardEl.getBoundingClientRect();
        const cx    = rect.left + rect.width  / 2;
        const cy    = rect.top  + rect.height / 2;

        for (let i = 0; i < count; i++) {
            const dot   = document.createElement('div');
            dot.className = 'poc-particle';
            const angle = (i / count) * 360 + Math.random() * (360 / count);
            const dist  = 50 + Math.random() * 90;
            const size  = rarity === 'legendary' ? 7 : rarity === 'epic' ? 6 : 5;
            dot.style.cssText = `left:${cx}px;top:${cy}px;background:${color};width:${size}px;height:${size}px;--dx:${Math.cos(angle*Math.PI/180)*dist}px;--dy:${Math.sin(angle*Math.PI/180)*dist}px;animation-delay:${Math.random()*80}ms;`;
            document.body.appendChild(dot);
            setTimeout(() => dot.remove(), 900);
        }

        if (rarity === 'legendary') {
            cardEl.classList.add('poc-legendary-reveal');
            setTimeout(() => cardEl.classList.remove('poc-legendary-reveal'), 1200);
        } else if (rarity === 'epic') {
            cardEl.classList.add('poc-epic-reveal');
            setTimeout(() => cardEl.classList.remove('poc-epic-reveal'), 800);
        } else if (rarity === 'rare') {
            cardEl.classList.add('poc-rare-reveal');
            setTimeout(() => cardEl.classList.remove('poc-rare-reveal'), 600);
        }
    }

    close() {
        const overlay = document.getElementById('pack-overlay');
        overlay.classList.remove('active');
        overlay.addEventListener('transitionend', () => {
            overlay.style.display = 'none';
        }, { once: true });
        this._revealedCount = 0;
    }

    _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
}

class RealmWarsApp {
    constructor() {
        this.packOpener = new PackOpener();
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

        // Burger / drawer
        const burger  = document.getElementById('burger-btn');
        const drawer  = document.getElementById('nav-drawer');
        const overlay = document.getElementById('drawer-overlay');
        const closeDrawer = () => {
            burger.classList.remove('open');
            drawer.classList.remove('open');
            overlay.classList.remove('open');
        };
        burger?.addEventListener('click', () => {
            const opening = !drawer.classList.contains('open');
            burger.classList.toggle('open', opening);
            drawer.classList.toggle('open', opening);
            overlay.classList.toggle('open', opening);
        });
        overlay?.addEventListener('click', closeDrawer);
        document.getElementById('drawer-close')?.addEventListener('click', closeDrawer);

        // Close drawer on any link click inside it
        drawer?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeDrawer));

        // Logout button
        document.getElementById('logout-btn')?.addEventListener('click', () => this._logout());

        // Route handler — also close drawer on hash change
        window.addEventListener('hashchange', () => { closeDrawer(); this._route(); });

        // Initial route
        this._route();
    }

    async _route() {
        const hash = window.location.hash || '#home';
        const page = hash.replace('#', '');

        // Fullscreen game mode — hide nav, remove margin
        document.body.classList.toggle('game-mode', page === 'game');

        // Destroy previous scenes
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

        // Keep nav rank + admin link current
        const cachedUser = auth.getUser();
        if (cachedUser?.rank) this._updateRankDisplay(cachedUser.rank);
        const adminLink = document.querySelector('.nav-link--admin');
        if (adminLink) adminLink.style.display = cachedUser?.is_admin ? '' : 'none';

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
            case 'admin': await this._renderAdmin(); break;
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

    // ===== RANK HELPERS =====

    _updateRankDisplay(rank) {
        if (!rank) return;
        const isLegend = rank.tier === 'Legend';

        // Nav badge
        const badge = document.getElementById('rank-badge');
        const label = document.getElementById('rank-label');
        if (badge) badge.textContent = rank.emoji;
        if (label) {
            label.textContent  = rank.label;
            label.style.color  = rank.color;
        }

        // Home hero
        const heroEmblem   = document.getElementById('rank-hero-emblem');
        const heroLabel    = document.getElementById('rank-hero-label');
        const heroStars    = document.getElementById('rank-hero-stars');
        const progressFill = document.getElementById('rank-progress-fill');
        const progressText = document.getElementById('rank-progress-text');
        const rankHero     = document.getElementById('rank-hero');

        if (heroEmblem) heroEmblem.textContent = rank.emoji;
        if (heroLabel)  { heroLabel.textContent = rank.label; heroLabel.style.color = rank.color; }
        if (rankHero)   rankHero.style.setProperty('--rank-color', rank.color);

        if (heroStars) {
            if (isLegend) {
                heroStars.innerHTML = '<span class="rank-star rank-star--lit">★</span>'.repeat(3);
            } else {
                const stars = rank.stars ?? 0;
                heroStars.innerHTML = [0,1,2].map(i =>
                    `<span class="rank-star ${i < stars ? 'rank-star--lit' : ''}">★</span>`
                ).join('');
            }
        }

        if (progressFill && progressText) {
            if (isLegend) {
                progressFill.style.width = '100%';
                progressText.textContent = '👑 Legend';
            } else {
                const tierFloors = { Bronze:0, Silver:30, Gold:60, Platinum:90, Diamond:120 };
                const tierFloor  = tierFloors[rank.tier] ?? 0;
                const local      = rank.points - tierFloor;   // 0-29
                const pct        = Math.round((local / 30) * 100);
                const nextTiers  = { Bronze:'Silver', Silver:'Gold', Gold:'Platinum', Platinum:'Diamond', Diamond:'Legend' };
                const nextTier   = nextTiers[rank.tier] || 'Legend';
                progressFill.style.width   = pct + '%';
                progressText.textContent   = `${local} / 30 stars to ${nextTier}`;
            }
        }
    }

    async _renderHome() {
        ui.showPage('home');

        try {
            const user = await auth.refreshUser();
            ui.updateGoldDisplay(user.gold);
            if (user.rank) this._updateRankDisplay(user.rank);

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
            const user = await auth.refreshUser();
            ui.hideLoadingSpinner();
            ui.updateGoldDisplay(user.gold);

            // Wire buy buttons and affordability on Blade-rendered shop cards
            document.querySelectorAll('.shop-pack-card').forEach(card => {
                const price  = parseInt(card.dataset.packPrice);
                const packId = parseInt(card.dataset.packId);
                const btn    = card.querySelector('.shop-buy-btn');
                card.classList.toggle('unaffordable', user.gold < price);
                if (btn) {
                    btn.onclick = () => {
                        this.currentPackId = packId;
                        window.location.hash = '#open-packs';
                    };
                }
            });

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
            const user = await auth.refreshUser();
            ui.updateGoldDisplay(user.gold);

            // Wire click handlers on Blade-rendered pack options
            const options = document.querySelectorAll('.pack-option');
            options.forEach(opt => {
                opt.onclick = () => {
                    options.forEach(p => p.classList.remove('selected'));
                    opt.classList.add('selected');
                    this.currentPackId = parseInt(opt.dataset.packId);
                };
            });

            // Auto-select pre-selected or first pack
            const toSelect = this.currentPackId
                ? document.querySelector(`.pack-option[data-pack-id="${this.currentPackId}"]`)
                : options[0];
            if (toSelect) {
                toSelect.classList.add('selected');
                this.currentPackId = parseInt(toSelect.dataset.packId);
            }

            const openBtn = document.getElementById('pack-open-btn');
            if (openBtn) openBtn.onclick = () => this._openSelectedPack();

        } catch (err) {
            ui.showNotification('Failed to load packs: ' + err.message, 'error');
        }
    }

    async _openSelectedPack() {
        if (!this.currentPackId) {
            ui.showNotification('Please select a pack first!', 'warning');
            return;
        }

        const selectedEl = document.querySelector(`.pack-option[data-pack-id="${this.currentPackId}"]`);
        const price   = parseInt(selectedEl?.dataset.packPrice || 0);
        const name    = selectedEl?.dataset.packName || '';
        const user    = auth.getUser();

        if (user && user.gold < price) {
            ui.showNotification(`Not enough gold! Need ${price}, have ${user.gold}.`, 'warning');
            return;
        }

        const openBtn = document.getElementById('pack-open-btn');
        openBtn.disabled    = true;
        openBtn.textContent = 'Opening...';

        try {
            const result = await api.openPack(this.currentPackId);
            auth.updateGold(result.gold_remaining);
            ui.updateGoldDisplay(result.gold_remaining);
            this.packOpener.show(result.cards, { id: this.currentPackId, name, price });
        } catch (err) {
            ui.showNotification(err.data?.error || err.message, 'error');
        } finally {
            openBtn.disabled    = false;
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

            // Rank banner
            if (s.rank) {
                this._updateRankDisplay(s.rank);
                const isLegend = s.rank.tier === 'Legend';
                const srbEmblem = document.getElementById('srb-emblem');
                const srbLabel  = document.getElementById('srb-label');
                const srbStars  = document.getElementById('srb-stars');
                const srbPoints = document.getElementById('srb-points');
                const srbNext   = document.getElementById('srb-next');
                const banner    = document.getElementById('stats-rank-banner');
                if (srbEmblem) srbEmblem.textContent = s.rank.emoji;
                if (srbLabel)  { srbLabel.textContent = s.rank.label; srbLabel.style.color = s.rank.color; }
                if (banner)    banner.style.setProperty('--rank-color', s.rank.color);
                if (srbPoints) srbPoints.textContent = s.rank.points + ' stars total';
                if (srbStars) {
                    if (isLegend) {
                        srbStars.innerHTML = '<span class="rank-star rank-star--lit">★</span>'.repeat(3);
                    } else {
                        const stars = s.rank.stars ?? 0;
                        srbStars.innerHTML = [0,1,2].map(i =>
                            `<span class="rank-star ${i < stars ? 'rank-star--lit' : ''}">★</span>`
                        ).join('');
                    }
                }
                if (srbNext) {
                    const nextTiers = { Bronze:'Silver', Silver:'Gold', Gold:'Platinum', Platinum:'Diamond', Diamond:'Legend' };
                    srbNext.textContent = isLegend ? '👑 Maximum rank achieved' : `Next: ${nextTiers[s.rank.tier] || 'Legend'} 10`;
                }
            }

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

    // ===== ADMIN =====

    async _renderAdmin() {
        ui.showPage('admin');

        const user = auth.getUser();
        if (!user?.is_admin) { window.location.hash = '#home'; return; }

        // Tab switching
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.onclick = () => {
                document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(`admin-tab-${tab.dataset.tab}`)?.classList.add('active');
                if (tab.dataset.tab === 'cards') this._adminLoadCards();
                if (tab.dataset.tab === 'users') this._adminLoadUsers();
                if (tab.dataset.tab === 'packs')         this._adminLoadPacks();
                if (tab.dataset.tab === 'translations') this._adminLoadTranslations();
            };
        });

        this._adminLoadDashboard();
    }

    async _adminLoadDashboard() {
        try {
            const d = await api.adminDashboard();
            const CLASS_EMOJI = { warrior:'⚔️', mage:'🔮', ranger:'🏹', paladin:'🛡️', druid:'🌿', neutral:'⭐' };

            document.getElementById('admin-stats-grid').innerHTML = [
                { icon:'👥', label:'Total Users',    value: d.total_users },
                { icon:'🃏', label:'Total Cards',    value: d.total_cards },
                { icon:'⚔️', label:'Total Games',    value: d.total_games },
                { icon:'🎮', label:'Active Games',   value: d.active_games },
                { icon:'📦', label:'Total Packs',    value: d.total_packs },
                { icon:'🪙', label:'Gold in Economy',value: d.gold_in_economy.toLocaleString() },
            ].map(s => `<div class="stat-card"><div class="stat-icon">${s.icon}</div><div class="stat-value">${s.value}</div><div class="stat-label">${s.label}</div></div>`).join('');

            document.getElementById('admin-recent-users').innerHTML = d.recent_users.map(u =>
                `<div class="admin-list-row">
                    <span class="alr-name">${u.name}</span>
                    <span class="alr-meta">${u.email}</span>
                    <span class="alr-badge">${u.roles?.includes('admin') ? '🛡️' : ''}${u.gold}🪙</span>
                </div>`
            ).join('') || '<div class="stats-empty">No users</div>';

            document.getElementById('admin-recent-games').innerHTML = d.recent_games.map(g =>
                `<div class="admin-list-row">
                    <span class="alr-name">${g.player1?.name ?? '?'} vs ${g.player2?.name ?? '?'}</span>
                    <span class="alr-badge admin-badge--${g.status}">${g.status}</span>
                </div>`
            ).join('') || '<div class="stats-empty">No games</div>';
        } catch (err) {
            ui.showNotification('Failed to load admin dashboard', 'error');
        }
    }

    async _adminLoadCards() {
        try {
            const cards = await api.adminGetCards();
            this._adminCards = cards;
            this._adminRenderCardsTable(cards);
            this._adminWireCardForm();

            const search = document.getElementById('admin-card-search');
            search.oninput = () => {
                const q = search.value.toLowerCase();
                this._adminRenderCardsTable(cards.filter(c =>
                    c.name.toLowerCase().includes(q) || c.hero_class.includes(q) || c.rarity.includes(q)
                ));
            };
        } catch (err) { ui.showNotification('Failed to load cards', 'error'); }
    }

    _adminRenderCardsTable(cards) {
        const RARITY_COLOR = { common:'#9ca3af', rare:'#3b82f6', epic:'#a855f7', legendary:'#f59e0b' };
        const CLASS_EMOJI  = { warrior:'⚔️', mage:'🔮', ranger:'🏹', paladin:'🛡️', druid:'🌿', neutral:'⭐' };
        document.getElementById('admin-cards-tbody').innerHTML = cards.map(c => `
            <tr data-card-id="${c.id}">
                <td><strong>${c.name}</strong></td>
                <td>${CLASS_EMOJI[c.hero_class] || ''} ${c.hero_class}</td>
                <td>${c.card_type}</td>
                <td><span style="color:${RARITY_COLOR[c.rarity]}">${c.rarity}</span></td>
                <td>${c.mana_cost}</td>
                <td>${c.card_type === 'spell' ? '—' : `${c.attack}/${c.health}`}</td>
                <td class="admin-actions">
                    <button class="btn btn-ghost btn-xs admin-card-edit" data-id="${c.id}">Edit</button>
                    <button class="btn btn-danger btn-xs admin-card-delete" data-id="${c.id}">Del</button>
                </td>
            </tr>`).join('');

        document.querySelectorAll('.admin-card-edit').forEach(btn => {
            btn.onclick = () => this._adminOpenCardForm(this._adminCards.find(c => c.id == btn.dataset.id));
        });
        document.querySelectorAll('.admin-card-delete').forEach(btn => {
            btn.onclick = () => this._adminDeleteCard(parseInt(btn.dataset.id));
        });
    }

    _adminWireCardForm() {
        document.getElementById('admin-card-new-btn').onclick = () => this._adminOpenCardForm(null);
        document.getElementById('admin-card-cancel').onclick  = () => {
            document.getElementById('admin-card-form-wrap').style.display = 'none';
        };

        const typeSelect = document.querySelector('#admin-card-form [name=card_type]');
        const statsGroup = document.getElementById('admin-card-stats-group');
        const hpGroup    = document.getElementById('admin-card-health-group');
        typeSelect.onchange = () => {
            const show = typeSelect.value === 'minion';
            statsGroup.style.display = show ? '' : 'none';
            hpGroup.style.display    = show ? '' : 'none';
        };

        document.getElementById('admin-card-form').onsubmit = async (e) => {
            e.preventDefault();
            const form = e.target;
            const id   = form.dataset.editId;
            const data = {
                name:        form.name.value,
                description: form.description.value,
                mana_cost:   parseInt(form.mana_cost.value),
                card_type:   form.card_type.value,
                hero_class:  form.hero_class.value,
                rarity:      form.rarity.value,
                flavor_text: form.flavor_text.value,
            };
            if (data.card_type === 'minion') {
                data.attack = parseInt(form.attack.value);
                data.health = parseInt(form.health.value);
            }
            const btn = form.querySelector('[type=submit]');
            btn.disabled = true;
            try {
                if (id) {
                    await api.adminUpdateCard(id, data);
                    ui.showNotification('Card updated!', 'success');
                } else {
                    await api.adminCreateCard(data);
                    ui.showNotification('Card created!', 'success');
                }
                document.getElementById('admin-card-form-wrap').style.display = 'none';
                this._adminLoadCards();
            } catch (err) {
                ui.showNotification(err.data?.message || err.message, 'error');
            } finally { btn.disabled = false; }
        };
    }

    _adminOpenCardForm(card) {
        const wrap  = document.getElementById('admin-card-form-wrap');
        const form  = document.getElementById('admin-card-form');
        const title = document.getElementById('admin-card-form-title');
        const statsGroup = document.getElementById('admin-card-stats-group');
        const hpGroup    = document.getElementById('admin-card-health-group');

        form.reset();
        if (card) {
            title.textContent        = 'Edit Card';
            form.dataset.editId      = card.id;
            form.name.value          = card.name;
            form.description.value   = card.description  || '';
            form.mana_cost.value     = card.mana_cost;
            form.card_type.value     = card.card_type;
            form.hero_class.value    = card.hero_class;
            form.rarity.value        = card.rarity;
            form.flavor_text.value   = card.flavor_text  || '';
            if (card.card_type === 'minion') {
                form.attack.value = card.attack;
                form.health.value = card.health;
            }
        } else {
            title.textContent   = 'New Card';
            delete form.dataset.editId;
        }
        const isMinion = (card?.card_type ?? 'minion') === 'minion';
        statsGroup.style.display = isMinion ? '' : 'none';
        hpGroup.style.display    = isMinion ? '' : 'none';
        wrap.style.display = '';
        wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    async _adminDeleteCard(id) {
        if (!confirm('Delete this card? This cannot be undone.')) return;
        try {
            await api.adminDeleteCard(id);
            ui.showNotification('Card deleted', 'success');
            this._adminLoadCards();
        } catch (err) { ui.showNotification(err.message, 'error'); }
    }

    async _adminLoadUsers() {
        try {
            const users = await api.adminGetUsers();
            this._adminUsers = users;
            this._adminRenderUsersTable(users);

            const search = document.getElementById('admin-user-search');
            search.oninput = () => {
                const q = search.value.toLowerCase();
                this._adminRenderUsersTable(users.filter(u =>
                    u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
                ));
            };
        } catch (err) { ui.showNotification('Failed to load users', 'error'); }
    }

    _adminRenderUsersTable(users) {
        document.getElementById('admin-users-tbody').innerHTML = users.map(u => `
            <tr>
                <td>${u.id}</td>
                <td><strong>${u.name}</strong></td>
                <td class="admin-cell-muted">${u.email}</td>
                <td>${(u.gold||0).toLocaleString()} 🪙</td>
                <td><span style="color:${u.rank?.color}">${u.rank?.emoji} ${u.rank?.label}</span></td>
                <td>${(u.roles||[]).map(r => `<span class="admin-role-pill admin-role-pill--${r}">${r}</span>`).join('') || '—'}</td>
                <td class="admin-actions">
                    <button class="btn btn-ghost btn-xs admin-user-edit" data-id="${u.id}">Edit</button>
                    <button class="btn btn-danger btn-xs admin-user-delete" data-id="${u.id}">Del</button>
                </td>
            </tr>`).join('');

        document.querySelectorAll('.admin-user-edit').forEach(btn => {
            btn.onclick = () => this._adminOpenUserModal(this._adminUsers.find(u => u.id == btn.dataset.id));
        });
        document.querySelectorAll('.admin-user-delete').forEach(btn => {
            btn.onclick = () => this._adminDeleteUser(parseInt(btn.dataset.id));
        });

        document.getElementById('admin-user-cancel').onclick = () => {
            document.getElementById('admin-user-modal').style.display = 'none';
        };
        document.getElementById('admin-user-form').onsubmit = async (e) => {
            e.preventDefault();
            const form = e.target;
            const id   = form.querySelector('[name=id]').value;
            const roles = [...form.querySelectorAll('[name^=role_]:checked')].map(cb => cb.value);
            const data  = {
                name:        form.name.value,
                email:       form.email.value,
                gold:        parseInt(form.gold.value),
                rank_points: parseInt(form.rank_points.value),
                roles,
            };
            const btn = form.querySelector('[type=submit]');
            btn.disabled = true;
            try {
                await api.adminUpdateUser(id, data);
                ui.showNotification('User updated!', 'success');
                document.getElementById('admin-user-modal').style.display = 'none';
                this._adminLoadUsers();
            } catch (err) {
                ui.showNotification(err.data?.message || err.message, 'error');
            } finally { btn.disabled = false; }
        };
    }

    _adminOpenUserModal(user) {
        const modal = document.getElementById('admin-user-modal');
        const form  = document.getElementById('admin-user-form');
        form.querySelector('[name=id]').value          = user.id;
        form.querySelector('[name=name]').value        = user.name;
        form.querySelector('[name=email]').value       = user.email;
        form.querySelector('[name=gold]').value        = user.gold ?? 0;
        form.querySelector('[name=rank_points]').value = user.rank_points ?? 0;
        form.querySelector('[name=role_admin]').checked      = user.roles?.includes('admin');
        form.querySelector('[name=role_moderator]').checked  = user.roles?.includes('moderator');
        modal.style.display = 'flex';
    }

    async _adminDeleteUser(id) {
        if (!confirm('Delete this user? This cannot be undone.')) return;
        try {
            await api.adminDeleteUser(id);
            ui.showNotification('User deleted', 'success');
            this._adminLoadUsers();
        } catch (err) { ui.showNotification(err.data?.error || err.message, 'error'); }
    }

    async _adminLoadPacks() {
        try {
            const packs = await api.adminGetPacks();
            this._adminPacks = packs;
            this._adminRenderPacksTable(packs);
            this._adminWirePackForm();
        } catch (err) { ui.showNotification('Failed to load packs', 'error'); }
    }

    _adminRenderPacksTable(packs) {
        document.getElementById('admin-packs-tbody').innerHTML = packs.map(p => `
            <tr>
                <td><strong>${p.name}</strong></td>
                <td class="admin-cell-muted">${p.set_name}</td>
                <td>${p.price} 🪙</td>
                <td>${p.card_count}</td>
                <td>${p.pack_openings_count ?? 0}</td>
                <td class="admin-actions">
                    <button class="btn btn-ghost btn-xs admin-pack-edit" data-id="${p.id}">Edit</button>
                    <button class="btn btn-danger btn-xs admin-pack-delete" data-id="${p.id}">Del</button>
                </td>
            </tr>`).join('');

        document.querySelectorAll('.admin-pack-edit').forEach(btn => {
            btn.onclick = () => this._adminOpenPackForm(this._adminPacks.find(p => p.id == btn.dataset.id));
        });
        document.querySelectorAll('.admin-pack-delete').forEach(btn => {
            btn.onclick = () => this._adminDeletePack(parseInt(btn.dataset.id));
        });
    }

    _adminWirePackForm() {
        document.getElementById('admin-pack-new-btn').onclick = () => this._adminOpenPackForm(null);
        document.getElementById('admin-pack-cancel').onclick  = () => {
            document.getElementById('admin-pack-form-wrap').style.display = 'none';
        };

        document.getElementById('admin-pack-form').onsubmit = async (e) => {
            e.preventDefault();
            const form = e.target;
            const id   = form.dataset.editId;
            const data = {
                name:       form.name.value,
                price:      parseInt(form.price.value),
                card_count: parseInt(form.card_count.value),
                set_name:   form.set_name.value,
            };
            const btn = form.querySelector('[type=submit]');
            btn.disabled = true;
            try {
                if (id) {
                    await api.adminUpdatePack(id, data);
                    ui.showNotification('Pack updated!', 'success');
                } else {
                    await api.adminCreatePack(data);
                    ui.showNotification('Pack created!', 'success');
                }
                document.getElementById('admin-pack-form-wrap').style.display = 'none';
                this._adminLoadPacks();
            } catch (err) {
                ui.showNotification(err.data?.message || err.message, 'error');
            } finally { btn.disabled = false; }
        };
    }

    _adminOpenPackForm(pack) {
        const wrap  = document.getElementById('admin-pack-form-wrap');
        const form  = document.getElementById('admin-pack-form');
        form.reset();
        if (pack) {
            document.getElementById('admin-pack-form-title').textContent = 'Edit Pack';
            form.dataset.editId  = pack.id;
            form.name.value       = pack.name;
            form.price.value      = pack.price;
            form.card_count.value = pack.card_count;
            form.set_name.value   = pack.set_name;
        } else {
            document.getElementById('admin-pack-form-title').textContent = 'New Pack';
            delete form.dataset.editId;
        }
        wrap.style.display = '';
        wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    async _adminDeletePack(id) {
        if (!confirm('Delete this pack?')) return;
        try {
            await api.adminDeletePack(id);
            ui.showNotification('Pack deleted', 'success');
            this._adminLoadPacks();
        } catch (err) { ui.showNotification(err.message, 'error'); }
    }

    /* ── Translations admin ───────────────────────────── */

    async _adminLoadTranslations() {
        // Load available locales and render locale toggle buttons
        try {
            const locales = await api.adminGetTranslationLocales();
            const container = document.getElementById('admin-trans-locales');
            if (container) {
                container.innerHTML = locales.map(l =>
                    `<button class="btn btn-sm ${this._adminTransLocale === l ? 'btn-primary' : 'btn-ghost'} admin-trans-locale-btn" data-locale="${l}">${l.toUpperCase()}</button>`
                ).join('');
                container.querySelectorAll('.admin-trans-locale-btn').forEach(btn => {
                    btn.onclick = () => {
                        this._adminTransLocale = btn.dataset.locale;
                        this._adminLoadTranslations();
                    };
                });
            }
            if (!this._adminTransLocale) this._adminTransLocale = locales[0] ?? 'en';
        } catch { this._adminTransLocale = this._adminTransLocale ?? 'en'; }

        // Load translations for current locale
        try {
            const rows = await api.adminGetTranslations(this._adminTransLocale);
            this._adminTransAll = rows;
            this._adminRenderTransTable(rows);
        } catch (err) { ui.showNotification(err.message, 'error'); }

        // Wire search
        const search = document.getElementById('admin-trans-search');
        if (search) {
            search.oninput = () => {
                const q = search.value.toLowerCase();
                const filtered = (this._adminTransAll ?? []).filter(r =>
                    r.key.toLowerCase().includes(q) || r.value.toLowerCase().includes(q)
                );
                this._adminRenderTransTable(filtered);
            };
        }

        // Wire new button
        const newBtn = document.getElementById('admin-trans-new-btn');
        if (newBtn) newBtn.onclick = () => this._adminOpenTransForm(null);
        const cancelBtn = document.getElementById('admin-trans-cancel');
        if (cancelBtn) cancelBtn.onclick = () => {
            document.getElementById('admin-trans-form-wrap').style.display = 'none';
        };

        // Wire form submit
        const form = document.getElementById('admin-trans-form');
        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                const data = Object.fromEntries(new FormData(form));
                const editId = form.dataset.editId;
                try {
                    if (editId) {
                        await api.adminUpdateTranslation(parseInt(editId), { value: data.value });
                        ui.showNotification('Translation updated', 'success');
                    } else {
                        data.locale = data.locale || this._adminTransLocale;
                        await api.adminCreateTranslation(data);
                        ui.showNotification('Translation created', 'success');
                    }
                    form.dataset.editId = '';
                    document.getElementById('admin-trans-form-wrap').style.display = 'none';
                    this._adminLoadTranslations();
                } catch (err) { ui.showNotification(err.message, 'error'); }
            };
        }
    }

    _adminRenderTransTable(rows) {
        const tbody = document.getElementById('admin-trans-tbody');
        if (!tbody) return;
        if (!rows.length) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;opacity:.6">No translations found</td></tr>';
            return;
        }
        tbody.innerHTML = rows.map(r => `
            <tr>
                <td><code style="font-size:.8rem">${r.key}</code></td>
                <td class="admin-trans-value-cell">${this._escapeHtml(r.value)}</td>
                <td class="admin-actions">
                    <button class="btn btn-ghost btn-xs admin-trans-edit-btn" data-id="${r.id}">Edit</button>
                    <button class="btn btn-danger btn-xs admin-trans-del-btn" data-id="${r.id}">Del</button>
                </td>
            </tr>`).join('');

        tbody.querySelectorAll('.admin-trans-edit-btn').forEach(btn => {
            btn.onclick = () => {
                const row = rows.find(r => r.id === parseInt(btn.dataset.id));
                if (row) this._adminOpenTransForm(row);
            };
        });
        tbody.querySelectorAll('.admin-trans-del-btn').forEach(btn => {
            btn.onclick = () => this._adminDeleteTranslation(parseInt(btn.dataset.id));
        });
    }

    _adminOpenTransForm(row) {
        const wrap = document.getElementById('admin-trans-form-wrap');
        const form = document.getElementById('admin-trans-form');
        const title = document.getElementById('admin-trans-form-title');
        if (!wrap || !form) return;

        if (row) {
            title.textContent = 'Edit Translation';
            form.elements['locale'].value = row.locale;
            form.elements['locale'].readOnly = true;
            form.elements['key'].value = row.key;
            form.elements['key'].readOnly = true;
            form.elements['value'].value = row.value;
            form.dataset.editId = row.id;
        } else {
            title.textContent = 'New Translation';
            form.reset();
            form.elements['locale'].value = this._adminTransLocale ?? 'en';
            form.elements['locale'].readOnly = false;
            form.elements['key'].readOnly = false;
            form.dataset.editId = '';
        }
        wrap.style.display = '';
        form.elements['value'].focus();
    }

    async _adminDeleteTranslation(id) {
        if (!confirm('Delete this translation?')) return;
        try {
            await api.adminDeleteTranslation(id);
            ui.showNotification('Translation deleted', 'success');
            this._adminLoadTranslations();
        } catch (err) { ui.showNotification(err.message, 'error'); }
    }

    _escapeHtml(str) {
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
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
