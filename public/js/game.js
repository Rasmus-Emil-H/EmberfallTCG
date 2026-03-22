/**
 * Realm Wars - Game Logic Manager
 */

import api from './api.js';
import { GameBoard } from './three-game.js';
import ui from './ui.js';

export class GameManager {
    constructor() {
        this.gameId = null;
        this.gameData = null;
        this.board = null;
        this.playerId = null;
        this.pollInterval = null;
        this.selectedAttacker = null;
        this.phase = 'idle'; // idle | selecting_target | waiting
        this._gameOverShown = false;
    }

    async startMatchmaking(container, playerId) {
        this.playerId = playerId;
        this._gameOverShown = false;

        ui.showNotification('Searching for an opponent...', 'info');

        try {
            const result = await api.joinQueue();
            this.gameId = result.game.id;
            this.gameData = result.game;

            if (result.status === 'active') {
                await this._initBoard(container);
                this._startPolling();
                ui.showNotification('Match found! Game starting!', 'success');
            } else {
                // Waiting for opponent - poll until matched
                ui.showNotification('Waiting for opponent...', 'info', 99999);
                this._pollForMatch(container);
            }
        } catch (err) {
            ui.showNotification('Failed to join queue: ' + err.message, 'error');
        }
    }

    async _pollForMatch(container) {
        this.matchPollInterval = setInterval(async () => {
            try {
                const result = await api.joinQueue();
                if (result.status === 'active') {
                    clearInterval(this.matchPollInterval);
                    this.gameId = result.game.id;
                    this.gameData = result.game;

                    // Hide matchmaking overlay
                    document.getElementById('matchmaking-overlay')?.remove();

                    await this._initBoard(container);
                    this._startPolling();
                    ui.showNotification('Match found!', 'success');
                }
            } catch (e) {
                // keep trying
            }
        }, 2000);
    }

    async _initBoard(container) {
        // Fetch all cards for the cache
        try {
            const cards = await api.getCards();
            window._cardCache = {};
            cards.forEach(c => { window._cardCache[c.id] = c; });
        } catch (e) {
            window._cardCache = {};
        }

        // Initialize 3D board
        this.board = new GameBoard(container);
        this.board.onCardClick((cardId, location) => this._handleCardClick(cardId, location));
        this.board.onTargetSelect((targetId, targetType) => this._handleTargetSelect(targetId, targetType));

        // Update board with current state
        if (this.gameData.game_state) {
            this.board.updateFromGameState(this.gameData.game_state, this.playerId);
        }

        this._updateGameUI();
    }

    _startPolling() {
        this.pollInterval = setInterval(async () => {
            await this.pollGameState();
        }, 2000);
    }

    async pollGameState() {
        if (!this.gameId) return;
        try {
            const result = await api.getGame(this.gameId);
            this.handleGameState(result);
        } catch (e) {
            // ignore polling errors
        }
    }

    handleGameState(gameData) {
        this.gameData = gameData;

        if (!gameData.game_state) return;

        const state = gameData.game_state;

        // Update 3D board
        if (this.board) {
            this.board.updateFromGameState(state, this.playerId);
        }

        this._updateGameUI();

        // Check game over
        if (gameData.status === 'finished' && !this._gameOverShown) {
            this._gameOverShown = true;
            clearInterval(this.pollInterval);
            this._showGameOver(gameData);
        }
    }

    _updateGameUI() {
        if (!this.gameData || !this.gameData.game_state) return;
        const state = this.gameData.game_state;
        const isMyTurn = state.active_player === this.playerId;

        // Update turn indicator
        const turnEl = document.getElementById('game-turn-indicator');
        if (turnEl) {
            turnEl.textContent = isMyTurn ? "YOUR TURN" : "OPPONENT'S TURN";
            turnEl.classList.toggle('your-turn', isMyTurn);
        }

        // Update end turn button
        const endTurnBtn = document.getElementById('end-turn-btn');
        if (endTurnBtn) {
            endTurnBtn.disabled = !isMyTurn;
        }

        // Update HP displays
        const myState = state.players[String(this.playerId)];
        const opponentKey = Object.keys(state.players).find(k => parseInt(k) !== this.playerId);
        const oppState = opponentKey ? state.players[opponentKey] : null;

        if (myState) {
            const hpEl = document.getElementById('player-hp');
            if (hpEl) hpEl.textContent = myState.hero_hp;
        }

        if (oppState) {
            const oppHpEl = document.getElementById('opponent-hp');
            if (oppHpEl) oppHpEl.textContent = oppState.hero_hp;

            // Update opponent info in status bar
            const oppNameEl = document.getElementById('opponent-name');
            if (oppNameEl && this.gameData.player2) {
                const oppId = this.playerId === this.gameData.player1_id
                    ? this.gameData.player2_id
                    : this.gameData.player1_id;
                const oppPlayer = this.playerId === this.gameData.player1_id
                    ? this.gameData.player2
                    : this.gameData.player1;
                if (oppPlayer) oppNameEl.textContent = oppPlayer.name;
            }
        }
    }

    _handleCardClick(cardId, location) {
        const state = this.gameData?.game_state;
        if (!state || state.active_player !== this.playerId) {
            ui.showNotification("It's not your turn!", 'warning');
            return;
        }

        if (location === 'hand') {
            // Play card from hand
            this.handleCardPlay(cardId);
        } else if (location === 'board') {
            // Select attacker
            this.selectedAttacker = cardId;
            this.phase = 'selecting_target';
            ui.showNotification('Select a target to attack!', 'info', 2000);
        }
    }

    _handleTargetSelect(targetId, targetType) {
        if (this.phase !== 'selecting_target' || !this.selectedAttacker) return;

        this.handleAttack(this.selectedAttacker, targetId, targetType);
        this.selectedAttacker = null;
        this.phase = 'idle';
    }

    async handleCardPlay(cardId) {
        try {
            ui.showLoadingSpinner('Playing card...');
            const result = await api.playCard(this.gameId, cardId, 0);
            ui.hideLoadingSpinner();

            if (result.game) {
                this.handleGameState(result.game);

                // Animate card play
                if (this.board) {
                    const cardData = window._cardCache?.[cardId] || { id: cardId };
                    this.board.playCard(cardData, 0);
                }
            }
        } catch (err) {
            ui.hideLoadingSpinner();
            ui.showNotification(err.data?.error || err.message, 'error');
        }
    }

    async handleAttack(attackerId, targetId, targetType = 'minion') {
        try {
            ui.showLoadingSpinner('Attacking...');
            const result = await api.attack(this.gameId, attackerId, targetId, targetType);
            ui.hideLoadingSpinner();

            if (result.game) {
                // Play attack animation
                if (this.board) {
                    this.board.attackAnimation(attackerId, targetType === 'minion' ? targetId : null);
                }

                // Wait for animation then update state
                setTimeout(() => {
                    this.handleGameState(result.game);
                }, 500);
            }
        } catch (err) {
            ui.hideLoadingSpinner();
            ui.showNotification(err.data?.error || err.message, 'error');
        }
    }

    async handleEndTurn() {
        try {
            ui.showLoadingSpinner('Ending turn...');
            const result = await api.endTurn(this.gameId);
            ui.hideLoadingSpinner();

            if (result.game) {
                this.handleGameState(result.game);
                ui.showNotification("Turn ended. Opponent's turn.", 'info');
            }
        } catch (err) {
            ui.hideLoadingSpinner();
            ui.showNotification(err.data?.error || err.message, 'error');
        }
    }

    async handleSurrender() {
        if (!confirm('Are you sure you want to surrender?')) return;
        try {
            const result = await api.surrender(this.gameId);
            if (result.game) {
                this.handleGameState(result.game);
            }
        } catch (err) {
            ui.showNotification(err.message, 'error');
        }
    }

    _showGameOver(gameData) {
        const isWinner = gameData.winner_id === this.playerId;
        const overlay = document.createElement('div');
        overlay.className = 'game-over-overlay';
        overlay.innerHTML = `
            <div class="game-over-result ${isWinner ? 'victory' : 'defeat'}">
                ${isWinner ? 'VICTORY!' : 'DEFEAT'}
            </div>
            <p style="color: var(--text-secondary); font-size: 1.1rem;">
                ${isWinner ? 'You have conquered your opponent!' : 'Better luck next time, champion.'}
            </p>
            <div style="display: flex; gap: 15px; margin-top: 10px;">
                <button class="btn btn-primary" onclick="window.location.hash='#home'">Return Home</button>
                <button class="btn btn-secondary" onclick="window.location.hash='#game'">Play Again</button>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
    }

    destroy() {
        clearInterval(this.pollInterval);
        clearInterval(this.matchPollInterval);
        if (this.board) {
            this.board.destroy();
            this.board = null;
        }
    }
}

export default GameManager;
