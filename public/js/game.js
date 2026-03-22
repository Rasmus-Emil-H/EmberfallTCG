/**
 * Realm Wars – Game Logic Manager (2D HTML board)
 */

import api from './api.js';
import ui from './ui.js';

const CLASS_EMOJI = { warrior:'⚔️', mage:'🔮', ranger:'🏹', paladin:'🛡️', druid:'🌿', neutral:'⭐' };
const CLASS_GRAD  = {
    warrior: 'linear-gradient(160deg,#7f1d1d,#b45309)',
    mage:    'linear-gradient(160deg,#1e3a5f,#4c1d95)',
    ranger:  'linear-gradient(160deg,#14532d,#065f46)',
    paladin: 'linear-gradient(160deg,#78350f,#92400e)',
    druid:   'linear-gradient(160deg,#14532d,#1a2e05)',
    neutral: 'linear-gradient(160deg,#1f2937,#374151)',
};

export class GameManager {
    constructor() {
        this.gameId            = null;
        this.gameData          = null;
        this.playerId          = null;
        this.pollInterval      = null;
        this.matchPollInterval = null;
        this.selectedAttacker  = null;   // cardId on player board
        this.phase             = 'idle'; // idle | selecting_target
        this._gameOverShown    = false;
        this._gameOverOverlay  = null;
        this._prevActivePlayer = null;
        this._myLog            = [];     // { icon, name, desc, mana, turn } entries
        this._oppLog           = [];
        this._prevOppHandSize  = null;
        this._prevOppBoardSize = null;
        this._turnNumber       = 0;
    }

    /* ── matchmaking ─────────────────────────────── */

    async startMatchmaking(_unused, playerId) {
        this.playerId = playerId;
        this._gameOverShown = false;

        const overlay = document.getElementById('matchmaking-overlay');
        const active  = document.getElementById('game-active');
        if (overlay) overlay.style.display = 'flex';
        if (active)  active.style.display  = 'none';

        try {
            const result = await api.joinQueue();
            this.gameId   = result.game.id;
            this.gameData = result.game;

            if (result.status === 'active') {
                await this._startGame();
            } else {
                this._pollForMatch();
            }
        } catch (err) {
            ui.showNotification('Failed to join queue: ' + err.message, 'error');
        }
    }

    _pollForMatch() {
        this.matchPollInterval = setInterval(async () => {
            try {
                const result = await api.joinQueue();
                if (result.status === 'active') {
                    clearInterval(this.matchPollInterval);
                    this.gameId   = result.game.id;
                    this.gameData = result.game;
                    await this._startGame();
                }
            } catch {}
        }, 2000);
    }

    async _startGame() {
        /* build card cache */
        try {
            const cards = await api.getCards();
            window._cardCache = {};
            cards.forEach(c => { window._cardCache[c.id] = c; });
        } catch { window._cardCache = {}; }

        /* show game UI */
        document.getElementById('matchmaking-overlay').style.display = 'none';
        document.getElementById('game-active').style.display = 'flex';

        /* wire drag-drop on the player minion row */
        this._wireDrop();

        if (this.gameData.game_state) {
            this._prevActivePlayer = this.gameData.game_state.active_player;
            this._applyState(this.gameData);
        }

        this.pollInterval = setInterval(() => this._poll(), 2500);
        ui.showNotification(window.APP_DATA?.t?.match_found ?? 'Match found! Game starting.', 'success');
    }

    /* ── drag-drop ───────────────────────────────── */

    _wireDrop() {
        /* ── minion board drop zone ── */
        const zone = document.getElementById('player-board');
        if (zone) {
            zone.addEventListener('dragover', e => {
                const cardId = parseInt(e.dataTransfer.types.includes('text/plain')
                    ? e.dataTransfer.getData('cardId') : 0, 10);
                /* don't highlight board for spells */
                const card = window._cardCache?.[cardId];
                if (card?.card_type === 'spell') return;
                e.preventDefault();
                zone.classList.add('drag-over');
                document.getElementById('play-zone-hint')?.classList.add('visible');
            });
            zone.addEventListener('dragleave', e => {
                if (!zone.contains(e.relatedTarget)) {
                    zone.classList.remove('drag-over');
                    document.getElementById('play-zone-hint')?.classList.remove('visible');
                }
            });
            zone.addEventListener('drop', e => {
                e.preventDefault();
                zone.classList.remove('drag-over');
                document.getElementById('play-zone-hint')?.classList.remove('visible');
                const cardId = parseInt(e.dataTransfer.getData('cardId'), 10);
                if (!cardId) return;
                const card = window._cardCache?.[cardId];
                if (card?.card_type === 'spell') return; /* spells must go to portrait */
                this.handleCardPlay(cardId);
            });
        }

        /* ── portrait drop zone for spells ── */
        const portrait = document.getElementById('player-portrait');
        if (portrait) {
            portrait.addEventListener('dragover', e => {
                const cardId = parseInt(e.dataTransfer.getData('cardId') || '0', 10);
                const card   = window._cardCache?.[cardId];
                if (!card || card.card_type !== 'spell') return;
                e.preventDefault();
                portrait.classList.add('dragover-spell');
            });
            portrait.addEventListener('dragleave', e => {
                if (!portrait.contains(e.relatedTarget))
                    portrait.classList.remove('dragover-spell');
            });
            portrait.addEventListener('drop', e => {
                e.preventDefault();
                portrait.classList.remove('dragover-spell', 'spell-drop-target');
                const cardId = parseInt(e.dataTransfer.getData('cardId'), 10);
                if (cardId) this.handleCardPlay(cardId);
            });
        }
    }

    /* ── polling ─────────────────────────────────── */

    async _poll() {
        if (!this.gameId) return;
        try { this._applyState(await api.getGame(this.gameId)); } catch {}
    }

    /* ── state application ───────────────────────── */

    _applyState(gameData) {
        this.gameData = gameData;
        const state   = gameData.game_state;
        if (!state) return;

        const isMyTurn    = state.active_player === this.playerId;
        const turnChanged = this._prevActivePlayer !== null
            && this._prevActivePlayer !== state.active_player;
        if (turnChanged) this._turnNumber++;
        if (turnChanged && isMyTurn) this._animateDrawCard();
        this._prevActivePlayer = state.active_player;

        const my  = state.players[String(this.playerId)];
        const oppKey = Object.keys(state.players).find(k => parseInt(k) !== this.playerId);
        const opp = oppKey ? state.players[oppKey] : null;

        if (my) {
            this._renderBoard(my.board  || [], false);
            this._renderHand(my.hand   || [], my);
            this._renderDeck(my.deck?.length ?? 0);
            this._renderMana(my.mana, my.max_mana);
            this._prevMyHandSize = (my.hand || []).length;
        }
        if (opp) {
            const oppHandSize  = (opp.hand  || []).length;
            const oppBoardSize = (opp.board || []).length;
            /* Detect opponent spell: hand shrunk but board didn't grow */
            if (this._prevOppHandSize !== null
                && oppHandSize < this._prevOppHandSize
                && oppBoardSize <= (this._prevOppBoardSize ?? oppBoardSize)) {
                const spellsPlayed = this._prevOppHandSize - oppHandSize;
                for (let i = 0; i < spellsPlayed; i++) {
                    this._recordOppSpell();
                }
            }
            this._prevOppHandSize  = oppHandSize;
            this._prevOppBoardSize = oppBoardSize;
            this._renderBoard(opp.board || [], true);
        }

        this._updateUI(state, gameData);

        if (gameData.status === 'finished' && !this._gameOverShown) {
            this._gameOverShown = true;
            clearInterval(this.pollInterval);
            this._showGameOver(gameData);
        }
    }

    /* ── board rendering ─────────────────────────── */

    _renderBoard(boardData, isOpp) {
        const el = document.getElementById(isOpp ? 'opponent-board' : 'player-board');
        if (!el) return;

        /* map of currently-rendered cards */
        const existing = new Map([...el.querySelectorAll('.board-card')]
            .map(c => [parseInt(c.dataset.cardId), c]));

        const newMap = new Map();
        boardData.forEach(ci => {
            const base = (window._cardCache?.[ci.id]) || {
                id: ci.id, name: `Card #${ci.id}`, hero_class: 'neutral',
                rarity: 'common', attack: 0, health: 0, card_type: 'minion',
            };
            if (base.card_type === 'spell') return;
            newMap.set(ci.id, { ...base,
                attack: ci.attack ?? base.attack,
                health: ci.health ?? base.health,
            });
        });

        /* remove / die cards no longer on board */
        existing.forEach((node, id) => {
            if (!newMap.has(id)) {
                const dead = window._cardCache?.[id] || { id, name: `Card #${id}`, hero_class: 'neutral', rarity: 'common', card_type: 'minion' };
                this._animateDeathToLog(node, isOpp, dead);
            }
        });

        /* update existing or append new */
        newMap.forEach((card, id) => {
            if (existing.has(id)) {
                this._updateBoardCard(existing.get(id), card);
            } else {
                el.appendChild(this._makeBoardCard(card, isOpp));
            }
        });

        el.classList.toggle('has-cards', newMap.size > 0);
    }

    _updateBoardCard(el, card) {
        const atkEl = el.querySelector('.bc-atk');
        const hpEl  = el.querySelector('.bc-hp');
        if (atkEl) atkEl.textContent = `⚔ ${card.attack ?? 0}`;
        if (hpEl) {
            const prevHp = parseInt(hpEl.dataset.hp ?? card.health);
            hpEl.textContent  = `♥ ${card.health ?? 0}`;
            hpEl.dataset.hp   = card.health;
            if (card.health < prevHp) {
                /* took damage — flash and redden HP */
                el.classList.add('impact-flash');
                setTimeout(() => el.classList.remove('impact-flash'), 380);
                hpEl.style.color = card.health <= 1 ? '#ff3333' : '#f87171';
            }
        }
    }

    _makeBoardCard(card, isOpp) {
        const el  = document.createElement('div');
        const cls = (card.hero_class || 'neutral').toLowerCase();
        el.className  = `board-card rarity-${card.rarity}${isOpp ? ' opponent-card' : ' player-card'}`;
        el.dataset.cardId = card.id;

        el.innerHTML = `
            <div class="bc-inner" style="--class-grad:${CLASS_GRAD[cls] || CLASS_GRAD.neutral}">
                <div class="bc-name">${card.name.length > 12 ? card.name.slice(0,11)+'…' : card.name}</div>
                <div class="bc-art">${CLASS_EMOJI[cls] || '⭐'}</div>
                ${card.card_type !== 'spell' ? `
                <div class="bc-stats">
                    <div class="bc-atk">⚔ ${card.attack ?? 0}</div>
                    <div class="bc-hp">♥ ${card.health ?? 0}</div>
                </div>` : `<div class="bc-spell-label">SPELL</div>`}
            </div>
        `;

        el.addEventListener('click', () => {
            if (isOpp) {
                this._handleTargetSelect(card.id, 'minion');
            } else {
                this._handleCardClick(card.id, 'board');
            }
        });

        return el;
    }

    /* ── hand rendering ──────────────────────────── */

    _renderHand(handIds, playerState) {
        const container = document.getElementById('game-hand');
        if (!container) return;
        container.innerHTML = '';

        handIds.forEach(cardId => {
            const card = window._cardCache?.[cardId] || {
                id: cardId, name: `Card #${cardId}`, mana_cost: 0,
                attack: 0, health: 0, card_type: 'minion',
                rarity: 'common', hero_class: 'neutral', description: '',
            };
            container.appendChild(this._makeHandCardEl(card, playerState));
        });
    }

    _makeHandCardEl(card, playerState) {
        const isMyTurn  = this.gameData?.game_state?.active_player === this.playerId;
        const canAfford = (playerState?.mana ?? 0) >= card.mana_cost;
        const playable  = isMyTurn && canAfford;
        const cls       = (card.hero_class || 'neutral').toLowerCase();

        const el = document.createElement('div');
        el.className  = `hand-card rarity-${card.rarity}${playable ? ' playable' : ' not-playable'}`;
        el.dataset.cardId = card.id;
        el.draggable  = playable;
        el.style.cssText = `--card-bg:${CLASS_GRAD[cls]||CLASS_GRAD.neutral};--rarity-color:${{common:'#6b7280',rare:'#3b82f6',epic:'#a855f7',legendary:'#f59e0b'}[card.rarity]||'#6b7280'}`;

        const desc = (card.description || '').length > 60
            ? card.description.slice(0, 58) + '…' : (card.description || '');

        el.innerHTML = `
            <div class="hc-mana">${card.mana_cost}</div>
            <div class="hc-art">${CLASS_EMOJI[cls] || '⭐'}</div>
            <div class="hc-name">${card.name}</div>
            <div class="hc-type">${card.card_type.toUpperCase()}</div>
            <div class="hc-desc">${desc}</div>
            ${card.card_type !== 'spell' ? `
            <div class="hc-stats">
                <div class="hc-atk">⚔ ${card.attack ?? 0}</div>
                <div class="hc-hp">♥ ${card.health ?? 0}</div>
            </div>` : ''}
            <div class="hc-tooltip"><strong>${card.name}</strong><br>${card.description || ''}${card.card_type!=='spell'?`<br><small>ATK ${card.attack} / HP ${card.health}</small>`:''}</div>
        `;

        if (playable) {
            el.addEventListener('dragstart', e => {
                e.dataTransfer.setData('cardId', card.id);
                e.dataTransfer.effectAllowed = 'move';
                el.classList.add('dragging');
                /* spells don't go on the board — show spell-drop zone instead */
                if (card.card_type === 'spell') {
                    document.getElementById('player-portrait')?.classList.add('spell-drop-target');
                } else {
                    document.getElementById('player-board')?.classList.add('drop-ready');
                }
            });
            el.addEventListener('dragend', () => {
                el.classList.remove('dragging');
                document.getElementById('player-board')?.classList.remove('drop-ready', 'drag-over');
                document.getElementById('play-zone-hint')?.classList.remove('visible');
                document.getElementById('player-portrait')?.classList.remove('spell-drop-target', 'dragover-spell');
            });
        }

        el.addEventListener('click', () => {
            if (!playable) {
                ui.showNotification(isMyTurn ? 'Not enough mana!' : "It's not your turn!", 'warning');
                return;
            }
            this.handleCardPlay(card.id);
        });

        return el;
    }

    /* ── deck + mana ─────────────────────────────── */

    _renderDeck(count) {
        const el = document.getElementById('deck-count-display');
        if (el) el.textContent = count;
        const stack = document.getElementById('deck-stack');
        if (stack) stack.style.opacity = count === 0 ? '0.2' : '1';
    }

    _renderMana(mana, maxMana) {
        const el = document.getElementById('game-mana-display');
        if (!el) return;
        el.innerHTML = '';
        for (let i = 0; i < (maxMana || 0); i++) {
            const g = document.createElement('div');
            g.className = 'mana-gem ' + (i < mana ? 'full' : 'empty');
            el.appendChild(g);
        }
    }

    /* ── draw animation ──────────────────────────── */

    _animateDrawCard() {
        const hand = document.getElementById('game-hand');
        if (!hand) return;
        hand.classList.add('drawing');
        setTimeout(() => hand.classList.remove('drawing'), 800);
        ui.showNotification('Card drawn!', 'info', 1500);
    }

    /* ── attack + death animations ───────────────── */

    _animateAttack(attackerEl, targetEl) {
        if (!attackerEl) return Promise.resolve();
        return new Promise(res => {
            const aRect = attackerEl.getBoundingClientRect();
            const tRect = targetEl
                ? targetEl.getBoundingClientRect()
                : document.getElementById('opponent-board').getBoundingClientRect();

            const dx = (tRect.left + tRect.width  / 2) - (aRect.left + aRect.width  / 2);
            const dy = (tRect.top  + tRect.height / 2) - (aRect.top  + aRect.height / 2);

            attackerEl.style.transition = 'transform 0.18s ease-out';
            attackerEl.style.transform  = `translate(${dx * 0.55}px, ${dy * 0.55}px) scale(1.12)`;

            /* impact flash on target */
            if (targetEl) {
                setTimeout(() => {
                    targetEl.classList.add('impact-flash');
                    setTimeout(() => targetEl.classList.remove('impact-flash'), 300);
                }, 160);
            }

            setTimeout(() => {
                attackerEl.style.transition = 'transform 0.22s ease-in';
                attackerEl.style.transform  = '';
                setTimeout(res, 240);
            }, 200);
        });
    }


    /* ── UI chrome ───────────────────────────────── */

    _updateUI(state, gameData) {
        const isMyTurn = state.active_player === this.playerId;
        const oppKey   = Object.keys(state.players).find(k => parseInt(k) !== this.playerId);
        const my       = state.players[String(this.playerId)];
        const opp      = oppKey ? state.players[oppKey] : null;

        /* turn indicator */
        const turnEl = document.getElementById('game-turn-indicator');
        if (turnEl) {
            turnEl.textContent = isMyTurn ? 'YOUR TURN' : "OPPONENT'S TURN";
            turnEl.className   = 'game-turn-indicator ' + (isMyTurn ? 'your-turn' : 'opp-turn');
        }

        /* end turn button */
        const etBtn = document.getElementById('end-turn-btn');
        if (etBtn) {
            etBtn.disabled = !isMyTurn;
            etBtn.classList.toggle('active-turn', isMyTurn);
            const sub = document.getElementById('end-turn-sub');
            if (sub) sub.textContent = isMyTurn ? 'Click to end' : "Opponent's turn";
        }

        /* HP bars + portrait HP */
        if (my) {
            const hpEl = document.getElementById('player-hp');
            if (hpEl) hpEl.textContent = my.hero_hp;
            const fill = document.getElementById('player-hp-fill');
            if (fill) fill.style.width = Math.max(0, (my.hero_hp / 30) * 100) + '%';
            const portEl = document.getElementById('portrait-my-hp');
            if (portEl) portEl.textContent = my.hero_hp;
        }
        if (opp) {
            const hpEl = document.getElementById('opponent-hp');
            if (hpEl) hpEl.textContent = opp.hero_hp;
            const fill = document.getElementById('opponent-hp-fill');
            if (fill) fill.style.width = Math.max(0, (opp.hero_hp / 30) * 100) + '%';
            const portEl = document.getElementById('portrait-opp-hp');
            if (portEl) portEl.textContent = opp.hero_hp;
        }

        /* opponent name */
        const oppNameEl = document.getElementById('opponent-name');
        if (oppNameEl && gameData) {
            const opp = this.playerId === gameData.player1_id ? gameData.player2 : gameData.player1;
            if (opp?.name) oppNameEl.textContent = opp.name;
        }
    }

    /* ── click handlers ──────────────────────────── */

    _handleCardClick(cardId, location) {
        const state = this.gameData?.game_state;
        if (!state || state.active_player !== this.playerId) {
            ui.showNotification("It's not your turn!", 'warning'); return;
        }
        if (location === 'board') {
            /* deselect if clicking selected attacker */
            if (this.selectedAttacker === cardId) {
                this.selectedAttacker = null;
                this.phase = 'idle';
                document.querySelectorAll('.board-card').forEach(c => c.classList.remove('selected-attacker'));
                return;
            }
            this.selectedAttacker = cardId;
            this.phase = 'selecting_target';
            document.querySelectorAll('.board-card').forEach(c =>
                c.classList.toggle('selected-attacker', parseInt(c.dataset.cardId) === cardId));
            ui.showNotification('Select a target!', 'info', 2000);
        }
    }

    _handleTargetSelect(targetId, targetType) {
        if (this.phase !== 'selecting_target' || !this.selectedAttacker) {
            /* if not in attack mode, attacking hero directly */
            if (targetType === 'hero') {
                const state = this.gameData?.game_state;
                if (state && state.active_player === this.playerId && this.selectedAttacker) {
                    this.handleAttack(this.selectedAttacker, null, 'hero');
                    this._clearAttackMode();
                }
            }
            return;
        }
        const atk = this.selectedAttacker;
        this._clearAttackMode();
        this.handleAttack(atk, targetId, targetType);
    }

    _clearAttackMode() {
        this.selectedAttacker = null;
        this.phase = 'idle';
        document.querySelectorAll('.board-card').forEach(c => c.classList.remove('selected-attacker'));
    }

    /* ── API actions ─────────────────────────────── */

    async handleCardPlay(cardId) {
        const state = this.gameData?.game_state;
        if (!state || state.active_player !== this.playerId) {
            ui.showNotification("It's not your turn!", 'warning'); return;
        }
        const card    = window._cardCache?.[cardId];
        const isSpell = card?.card_type === 'spell';
        /* grab the hand-card element now — it disappears after state update */
        const handEl  = document.querySelector(`#game-hand .hand-card[data-card-id="${cardId}"]`);

        try {
            const result = await api.playCard(this.gameId, cardId, 0);
            if (isSpell && card) {
                /* animate card flying to portrait, add to log */
                if (handEl) await this._animateSpellCast(handEl);
                this._recordMySpell(card);
            }
            if (result.game) this._applyState(result.game);
        } catch (err) {
            ui.showNotification(err.data?.error || err.message, 'error');
        }
    }

    /* ── spell log ───────────────────────────────── */

    _animateSpellCast(sourceEl) {
        return new Promise(res => {
            const portrait = document.getElementById('player-portrait');
            if (!portrait || !sourceEl) { res(); return; }

            const sRect = sourceEl.getBoundingClientRect();
            const pRect = portrait.getBoundingClientRect();

            const clone = document.createElement('div');
            clone.className = 'spell-fly-clone';
            clone.style.cssText = `
                position:fixed;
                left:${sRect.left}px; top:${sRect.top}px;
                width:${sRect.width}px; height:${sRect.height}px;
                pointer-events:none; z-index:9999;
                border-radius:8px; overflow:hidden;
                transition:none;
                background:${sourceEl.style.cssText.match(/--card-bg:([^;]+)/)?.[1] || 'rgba(100,50,200,0.8)'};
                border:2px solid rgba(167,139,250,0.7);
                box-shadow:0 0 20px rgba(167,139,250,0.6);
            `;
            clone.innerHTML = sourceEl.innerHTML;
            document.body.appendChild(clone);

            requestAnimationFrame(() => requestAnimationFrame(() => {
                const tx = (pRect.left + pRect.width  / 2) - (sRect.left + sRect.width  / 2);
                const ty = (pRect.top  + pRect.height / 2) - (sRect.top  + sRect.height / 2);
                clone.style.transition = 'transform 0.42s cubic-bezier(0.4,0,0.2,1), opacity 0.42s, filter 0.42s, width 0.42s, height 0.42s';
                clone.style.transform  = `translate(${tx}px,${ty}px) scale(0.18)`;
                clone.style.opacity    = '0';
                clone.style.filter     = 'brightness(3) blur(3px) saturate(2)';

                setTimeout(() => {
                    clone.remove();
                    portrait.classList.add('spell-absorbed');
                    setTimeout(() => portrait.classList.remove('spell-absorbed'), 700);
                    res();
                }, 450);
            }));
        });
    }

    _addToLog(isMe, entry) {
        const log = isMe ? this._myLog : this._oppLog;
        log.push({ ...entry, turn: this._turnNumber });
        this._renderLog(isMe ? 'my' : 'opp');
    }

    _renderLog(who) {
        const isMe    = who === 'my';
        const log     = isMe ? this._myLog : this._oppLog;
        const listEl  = document.getElementById(isMe ? 'my-log-list'  : 'opp-log-list');
        const countEl = document.getElementById(isMe ? 'my-log-count' : 'opp-log-count');
        const wrapEl  = document.getElementById(isMe ? 'my-log-wrap'  : 'opp-log-wrap');

        if (!listEl) return;
        if (countEl) countEl.textContent = log.length;
        if (wrapEl && log.length > 0) wrapEl.classList.add('has-spells');

        listEl.innerHTML = '';
        if (log.length === 0) {
            listEl.innerHTML = `<div class="spell-log-empty">Nothing yet</div>`;
            return;
        }

        [...log].reverse().forEach(({ icon, name, desc, mana, turn, typeTag }) => {
            const row = document.createElement('div');
            row.className = 'spell-log-entry';
            row.innerHTML = `
                <div class="sle-icon">${icon}</div>
                <div class="sle-info">
                    <div class="sle-name">${name}</div>
                    <div class="sle-meta">${typeTag ? `<span class="sle-tag sle-tag--${typeTag}">${typeTag}</span> ` : ''}${desc ? desc.slice(0, 48) + (desc.length > 48 ? '…' : '') : ''} · T${turn}</div>
                </div>
                ${mana != null ? `<div class="sle-mana">${mana}</div>` : ''}
            `;
            listEl.appendChild(row);
        });
    }

    /* Death animation: flash, then fly card to log badge */
    _animateDeathToLog(cardEl, isOpp, card) {
        const badgeId = isOpp ? 'opp-log-badge' : 'my-log-badge';
        const badge   = document.getElementById(badgeId);

        cardEl.classList.add('dying');

        const cRect = cardEl.getBoundingClientRect();

        setTimeout(() => {
            if (badge) {
                const bRect = badge.getBoundingClientRect();
                const clone = document.createElement('div');
                clone.className = 'spell-fly-clone';
                clone.style.cssText = `
                    position:fixed;
                    left:${cRect.left}px; top:${cRect.top}px;
                    width:${cRect.width}px; height:${cRect.height}px;
                    pointer-events:none; z-index:9999;
                    border-radius:7px; overflow:hidden; opacity:0.7;
                    background:linear-gradient(160deg,#111,#222);
                    border:2px solid rgba(255,255,255,0.15);
                    filter:grayscale(1) brightness(0.6);
                    transition:none;
                `;
                document.body.appendChild(clone);

                requestAnimationFrame(() => requestAnimationFrame(() => {
                    const tx = (bRect.left + bRect.width/2)  - (cRect.left + cRect.width/2);
                    const ty = (bRect.top  + bRect.height/2) - (cRect.top  + cRect.height/2);
                    clone.style.transition = 'transform 0.4s ease-in, opacity 0.4s';
                    clone.style.transform  = `translate(${tx}px,${ty}px) scale(0.15)`;
                    clone.style.opacity    = '0';
                    setTimeout(() => clone.remove(), 420);
                }));
            }

            cardEl.remove();

            const cls = (card.hero_class || 'neutral').toLowerCase();
            this._addToLog(!isOpp, {
                icon:    CLASS_EMOJI[cls] || '⭐',
                name:    card.name,
                desc:    card.description || '',
                mana:    null,
                typeTag: 'died',
            });
        }, 300);
    }

    _recordMySpell(card) {
        const cls = (card.hero_class || 'neutral').toLowerCase();
        this._addToLog(true, {
            icon:    CLASS_EMOJI[cls] || '✨',
            name:    card.name,
            desc:    card.description || '',
            mana:    card.mana_cost,
            typeTag: 'spell',
        });
        ui.showNotification(`✨ ${card.name} cast!`, 'info', 1800);
    }

    _recordOppSpell() {
        this._addToLog(false, {
            icon:    '✨',
            name:    'Unknown Spell',
            desc:    'Opponent cast a spell',
            mana:    null,
            typeTag: 'spell',
        });
        ui.showNotification('✨ Opponent cast a spell!', 'warning', 1800);
    }

    async handleAttack(attackerId, targetId, targetType = 'minion') {
        const attackerEl = document.querySelector(`#player-board .board-card[data-card-id="${attackerId}"]`);
        const targetEl   = targetId
            ? document.querySelector(`#opponent-board .board-card[data-card-id="${targetId}"]`)
            : document.querySelector('.opponent-portrait');

        await this._animateAttack(attackerEl, targetEl);

        try {
            const result = await api.attack(this.gameId, attackerId, targetId, targetType);
            if (result.game) this._applyState(result.game);
        } catch (err) {
            ui.showNotification(err.data?.error || err.message, 'error');
        }
    }

    async handleEndTurn() {
        try {
            const result = await api.endTurn(this.gameId);
            if (result.game) {
                this._applyState(result.game);
                ui.showNotification('Turn ended.', 'info');
            }
        } catch (err) {
            ui.showNotification(err.data?.error || err.message, 'error');
        }
    }

    async handleSurrender() {
        if (!confirm('Surrender this game?')) return;
        try {
            const result = await api.surrender(this.gameId);
            if (result.game) this._applyState(result.game);
        } catch (err) {
            ui.showNotification(err.message, 'error');
        }
    }

    /* ── game over ───────────────────────────────── */

    _showGameOver(gameData) {
        const win = gameData.winner_id === this.playerId;
        const overlay = document.createElement('div');
        overlay.className = 'game-over-overlay';

        const rankRowId = 'game-over-rank-row';
        overlay.innerHTML = `
            <div class="game-over-card">
                <div class="game-over-result ${win ? 'victory' : 'defeat'}">${win ? (window.APP_DATA?.t?.victory ?? '⚔ VICTORY!') : (window.APP_DATA?.t?.defeat ?? '💀 DEFEAT')}</div>
                <p>${win ? (window.APP_DATA?.t?.you_conquered ?? 'You have conquered the realm!') : (window.APP_DATA?.t?.better_luck ?? 'Better luck next battle, champion.')}</p>
                <div id="${rankRowId}" class="game-over-rank-row">${window.APP_DATA?.t?.rank_updating ?? '⏳ Updating rank…'}</div>
                <div class="game-over-actions">
                    <button class="btn btn-primary" id="go-btn-home">${window.APP_DATA?.t?.return_home ?? 'Return Home'}</button>
                    <button class="btn btn-ghost"   id="go-btn-again">${window.APP_DATA?.t?.play_again ?? 'Play Again'}</button>
                </div>
            </div>`;
        this._gameOverOverlay = overlay;
        document.body.appendChild(overlay);

        overlay.querySelector('#go-btn-home').addEventListener('click', () => {
            this.destroy();
            window.location.hash = '#home';
        });
        overlay.querySelector('#go-btn-again').addEventListener('click', () => {
            this.destroy();
            window.location.hash = '#game';
        });

        // Fetch updated rank
        api.getMe().then(user => {
            const row = document.getElementById(rankRowId);
            if (!row || !user.rank) return;
            const r = user.rank;
            const stars = r.tier === 'Legend' ? '★★★' : ['☆','☆','☆'].map((s,i) => i < r.stars ? '★' : '☆').join('');
            row.innerHTML = `<span style="color:${r.color}">${r.emoji} ${r.label}</span> <span class="gorr-stars">${stars}</span>`;
            if (win) this._showRankToast(r);
        }).catch(() => {
            const row = document.getElementById(rankRowId);
            if (row) row.textContent = '';
        });
    }

    _showRankToast(rank) {
        const toast = document.createElement('div');
        toast.className = 'rank-up-toast';
        toast.style.setProperty('--rank-color', rank.color);
        toast.innerHTML = `
            <div class="rank-up-emoji">${rank.emoji}</div>
            <div class="rank-up-title">${rank.label}</div>
            <div class="rank-up-label">${window.APP_DATA?.t?.star_earned ?? '+1 Star earned!'}</div>`;
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('visible'));
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 400);
        }, 2200);
    }

    /* ── cleanup ─────────────────────────────────── */

    destroy() {
        clearInterval(this.pollInterval);
        clearInterval(this.matchPollInterval);
        this._gameOverOverlay?.remove();
        this._gameOverOverlay = null;
    }
}

export default GameManager;
