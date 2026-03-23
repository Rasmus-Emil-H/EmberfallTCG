<!-- GAME PAGE -->
<div id="game-page" class="page game-page-fullscreen">

    <!-- Matchmaking Screen -->
    <div id="matchmaking-overlay" class="matchmaking-overlay">
        <div class="matchmaking-card">
            <div class="matchmaking-icon">⚔️</div>
            <h2>{{ __('app.game_finding_match') }}</h2>
            <div class="matchmaking-spinner"></div>
            <p class="matchmaking-status">{{ __('app.game_searching') }}</p>
            <button class="btn btn-ghost btn-sm" onclick="window.location.hash='#home'">{{ __('app.game_cancel') }}</button>
        </div>
    </div>

    <!-- Active Game UI (hidden until match found) -->
    <div id="game-active" style="display:none;width:100%;height:100%;flex-direction:column;">

        <!-- Top: Opponent info bar -->
        <div class="game-top-bar">
            <div class="game-hero-info opponent">
                <div class="hero-avatar opponent-avatar">👤</div>
                <div class="hero-details">
                    <span class="hero-name" id="opponent-name">{{ __('app.game_opponent') }}</span>
                    <div class="hero-hp-bar">
                        <div class="hero-hp-fill opponent-hp-fill" id="opponent-hp-fill" style="width:100%"></div>
                        <span class="hero-hp-text" id="opponent-hp">30</span>
                    </div>
                </div>
            </div>
            <div id="game-turn-indicator" class="game-turn-indicator">{{ __('app.game_waiting') }}</div>
            <div class="game-hero-info player">
                <div class="hero-details" style="align-items:flex-end;">
                    <span class="hero-name" id="player-name-display">{{ __('app.game_you') }}</span>
                    <div class="hero-hp-bar">
                        <div class="hero-hp-fill player-hp-fill" id="player-hp-fill" style="width:100%"></div>
                        <span class="hero-hp-text" id="player-hp">30</span>
                    </div>
                </div>
                <div class="hero-avatar player-avatar">🧙</div>
            </div>
        </div>

        <!-- 2D Board -->
        <div class="game-mid">

            <div class="game-board-2d">
                <!-- Decorative corner elements -->
                <div class="board-corner board-corner-tl"></div>
                <div class="board-corner board-corner-tr"></div>
                <div class="board-corner board-corner-bl"></div>
                <div class="board-corner board-corner-br"></div>

                <!-- Opponent hero zone -->
                <div class="board-hero-row board-hero-row--top">
                    <div class="board-hero-portrait opponent-portrait" id="opponent-portrait">
                        <span class="hero-portrait-emoji" id="portrait-opp-icon">👤</span>
                        <div class="hero-portrait-hp" id="portrait-opp-hp">30</div>
                    </div>
                    <!-- Opponent game log (spells + deaths) -->
                    <div class="spell-log-wrap spell-log-wrap--opp" id="opp-log-wrap">
                        <div class="spell-log-badge" id="opp-log-badge">
                            <span class="spell-log-icon">📜</span>
                            <span class="spell-log-count" id="opp-log-count">0</span>
                        </div>
                        <div class="spell-log-popup" id="opp-log-popup">
                            <div class="spell-log-title">{{ __('app.game_opponent_log') }}</div>
                            <div class="spell-log-list" id="opp-log-list">
                                <div class="spell-log-empty">{{ __('app.game_nothing_yet') }}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Opponent minions -->
                <div class="board-minion-row board-minion-row--top" id="opponent-board"></div>

                <!-- Center divider line -->
                <div class="board-divider">
                    <div class="board-divider-line"></div>
                    <div class="board-divider-gem"></div>
                </div>

                <!-- Player minions + drop zone -->
                <div class="board-minion-row board-minion-row--bottom" id="player-board">
                    <div class="play-zone-hint" id="play-zone-hint">{{ __('app.game_drop_hint') }}</div>
                </div>

                <!-- Player hero zone -->
                <div class="board-hero-row board-hero-row--bottom">
                    <div class="board-hero-portrait player-portrait" id="player-portrait">
                        <span class="hero-portrait-emoji" id="portrait-my-icon">🧙</span>
                        <div class="hero-portrait-hp" id="portrait-my-hp">30</div>
                    </div>
                    <!-- Player game log (spells + deaths) -->
                    <div class="spell-log-wrap spell-log-wrap--player" id="my-log-wrap">
                        <div class="spell-log-badge" id="my-log-badge">
                            <span class="spell-log-icon">📜</span>
                            <span class="spell-log-count" id="my-log-count">0</span>
                        </div>
                        <div class="spell-log-popup" id="my-log-popup">
                            <div class="spell-log-title">{{ __('app.game_your_log') }}</div>
                            <div class="spell-log-list" id="my-log-list">
                                <div class="spell-log-empty">{{ __('app.game_nothing_yet') }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right: Deck sidebar -->
            <div class="game-deck-sidebar">
                <div class="deck-sidebar-label">{{ __('app.game_your_deck') }}</div>
                <div class="deck-stack" id="deck-stack">
                    <div class="deck-card-back deck-back-3"></div>
                    <div class="deck-card-back deck-back-2"></div>
                    <div class="deck-card-back deck-back-1"></div>
                </div>
                <div class="deck-count-badge" id="deck-count-display">30</div>
                <div class="deck-sidebar-label" style="font-size:0.65rem;margin-top:4px;">{{ __('app.game_cards_left') }}</div>

                <div style="flex:1;"></div>

                <!-- Mana display -->
                <div class="sidebar-mana">
                    <div class="sidebar-mana-label">{{ __('app.game_mana') }}</div>
                    <div id="game-mana-display" class="mana-display-sidebar"></div>
                </div>

                <div style="flex:1;"></div>

                <!-- Controls -->
                <div class="sidebar-controls">
                    <button id="end-turn-btn" class="btn btn-gold end-turn-btn" disabled>
                        <span class="end-turn-text">{{ __('app.game_end_turn') }}</span>
                        <span class="end-turn-sub" id="end-turn-sub">{{ __('app.game_opponents_turn') }}</span>
                    </button>
                    <button id="surrender-btn" class="btn btn-danger btn-sm surrender-btn">{{ __('app.game_surrender') }}</button>
                </div>
            </div>
        </div>

        <!-- Bottom: Player hand -->
        <div class="game-hand-area">
            <div id="game-hand" class="game-hand">
                <!-- Hand cards rendered by JS as HTML -->
            </div>
        </div>

    </div>
</div>
