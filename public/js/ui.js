/**
 * Realm Wars UI Manager
 */

import { CLASS_EMOJI } from './constants.js';

class UIManager {
    constructor() {
        this.pages = {};
        this.currentPage = null;
        this._initPages();
        this._tooltip = null;
        this._createTooltip();
    }

    _initPages() {
        document.querySelectorAll('.page').forEach(page => {
            this.pages[page.id] = page;
        });
    }

    _createTooltip() {
        this._tooltip = document.createElement('div');
        this._tooltip.className = 'card-tooltip';
        this._tooltip.id = 'card-tooltip';
        document.body.appendChild(this._tooltip);
    }

    showPage(pageName) {
        // Always query live DOM so we never miss a page
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

        const target = document.getElementById(pageName + '-page') || document.getElementById(pageName);
        if (target) {
            target.classList.add('active');
            this.currentPage = pageName;
        }

        // Update drawer links
        document.querySelectorAll('.drawer-link').forEach(link => {
            link.classList.toggle('active', link.dataset.page === pageName);
        });
    }

    updateGoldDisplay(gold) {
        const el = document.getElementById('gold-display');
        if (el) {
            el.textContent = gold.toLocaleString();
        }
    }

    showNotification(message, type = 'info', duration = 3500) {
        const container = document.getElementById('notifications');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        container.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    showLoadingSpinner(text = 'Loading...') {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.add('active');
            const textEl = overlay.querySelector('.loading-text');
            if (textEl) textEl.textContent = text;
        }
    }

    hideLoadingSpinner() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }

    createCardElement(card, options = {}) {
        const div = document.createElement('div');
        div.className = `card-item`;
        div.dataset.cardId  = card.id;
        div.dataset.rarity  = card.rarity;

        const classKey   = (card.hero_class || 'neutral').toLowerCase();
        const classEmoji = CLASS_EMOJI[classKey] || '⭐';
        const isMinion   = card.card_type !== 'spell';

        const rarityLabel = { common:'Common', rare:'Rare', epic:'Epic', legendary:'Legendary' };

        div.innerHTML = `
            ${options.quantity !== undefined ? `<div class="card-quantity-badge">×${options.quantity}</div>` : ''}
            <div class="card-mana">${card.mana_cost}</div>
            <div class="card-name-row">
                <div class="card-name">${card.name}</div>
            </div>
            <div class="card-art class-${classKey}">${classEmoji}</div>
            <div class="card-type-banner">
                <span class="card-type-text">${card.card_type} · ${rarityLabel[card.rarity] || card.rarity}</span>
            </div>
            <div class="card-desc">${card.description || ''}</div>
            ${isMinion ? `
            <div class="card-stats-row">
                <div class="card-attack">${card.attack ?? 0}</div>
                <div class="card-health">${card.health ?? 0}</div>
            </div>` : '<div class="card-stats-row"></div>'}
        `;

        div.addEventListener('mouseenter', (e) => this.showCardTooltip(card, e));
        div.addEventListener('mousemove',  (e) => this.moveCardTooltip(e));
        div.addEventListener('mouseleave', ()  => this.hideCardTooltip());

        if (options.onClick) {
            div.addEventListener('click', () => options.onClick(card, div));
        }

        return div;
    }

    renderCards(container, cards, options = {}) {
        container.innerHTML = '';
        if (!cards || cards.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🃏</div>
                    <h3>No Cards Found</h3>
                    <p>Open some packs to grow your collection!</p>
                </div>
            `;
            return;
        }

        cards.forEach(card => {
            const el = this.createCardElement(card, options);
            container.appendChild(el);
        });
    }

    renderShop(container, packs, options = {}) {
        container.innerHTML = '';
        packs.forEach(pack => {
            const div = document.createElement('div');
            div.className = 'pack-card';

            let artClass = 'starter';
            let emoji = '📦';
            if (pack.name.toLowerCase().includes('arcane')) {
                artClass = 'arcane';
                emoji = '🔮';
            } else if (pack.name.toLowerCase().includes('legendary')) {
                artClass = 'legendary';
                emoji = '✨';
            }

            div.innerHTML = `
                <div class="pack-art ${artClass}">${emoji}</div>
                <div class="pack-name">${pack.name}</div>
                <div class="pack-desc">${pack.card_count} cards per pack · ${this.getSetLabel(pack.set_name)}</div>
                <div class="pack-price">${pack.price} <span>Gold</span></div>
                <button class="btn btn-primary btn-sm" data-pack-id="${pack.id}">Open Pack</button>
            `;

            if (options.onBuy) {
                div.querySelector('button').addEventListener('click', () => options.onBuy(pack));
            }

            container.appendChild(div);
        });
    }

    getSetLabel(setName) {
        const labels = {
            realm_wars_core: 'Core Set',
            arcane_collection: 'Arcane Collection',
            legendary_trove: 'Legendary Trove',
        };
        return labels[setName] || setName;
    }

    showCardTooltip(card, event) {
        const tooltip = this._tooltip;
        tooltip.innerHTML = `
            <div class="tooltip-name">${card.name}</div>
            <div class="tooltip-type">${card.rarity} ${card.card_type} · ${card.hero_class}</div>
            ${card.description ? `<div class="tooltip-desc">${card.description}</div>` : ''}
            ${card.flavor_text ? `<div class="tooltip-flavor">"${card.flavor_text}"</div>` : ''}
        `;
        tooltip.classList.add('visible');
        this.moveCardTooltip(event);
    }

    moveCardTooltip(event) {
        const tooltip = this._tooltip;
        const x = event.clientX + 15;
        const y = event.clientY - 10;
        const rect = tooltip.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        tooltip.style.left = (x + rect.width > vw ? x - rect.width - 30 : x) + 'px';
        tooltip.style.top = (y + rect.height > vh ? y - rect.height : y) + 'px';
    }

    hideCardTooltip() {
        this._tooltip.classList.remove('visible');
    }

    setNavVisibility(loggedIn) {
        const authLinks = document.querySelectorAll('[data-auth="required"]');
        const guestLinks = document.querySelectorAll('[data-auth="guest"]');

        authLinks.forEach(el => el.style.display = loggedIn ? '' : 'none');
        guestLinks.forEach(el => el.style.display = loggedIn ? 'none' : '');
    }

    showModal(title, content) {
        const overlay = document.getElementById('modal-overlay');
        if (!overlay) return;
        overlay.querySelector('.modal-title').textContent = title;
        overlay.querySelector('.modal-body').innerHTML = content;
        overlay.classList.add('active');
    }

    hideModal() {
        const overlay = document.getElementById('modal-overlay');
        if (overlay) overlay.classList.remove('active');
    }
}

const ui = new UIManager();
export default ui;
