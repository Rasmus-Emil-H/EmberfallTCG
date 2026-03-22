<!-- HOME PAGE -->
<div id="home-page" class="page">

    <!-- Rank Hero Banner -->
    <div class="rank-hero glass-card" id="rank-hero">
        <div class="rank-hero-emblem" id="rank-hero-emblem">🥉</div>
        <div class="rank-hero-info">
            <div class="rank-hero-label" id="rank-hero-label">Bronze 10</div>
            <div class="rank-hero-stars" id="rank-hero-stars"></div>
            <div class="rank-hero-progress" id="rank-hero-progress">
                <div class="rank-progress-bar"><div class="rank-progress-fill" id="rank-progress-fill" style="width:0%"></div></div>
                <span class="rank-progress-text" id="rank-progress-text">0 / 30 stars to Silver</span>
            </div>
        </div>
        <a href="#game" class="btn btn-primary rank-hero-play">⚔️ {{ __('app.home_play_ranked') }}</a>
    </div>

    <div class="dashboard-grid">
        <div class="dashboard-card glass-card" onclick="window.location.hash='#game'">
            <div class="dash-icon">⚔️</div>
            <div class="dash-content">
                <h3>{{ __('app.home_battle') }}</h3>
                <p>{{ __('app.home_battle_desc') }}</p>
            </div>
            <div class="dash-arrow">→</div>
        </div>
        <div class="dashboard-card glass-card" onclick="window.location.hash='#open-packs'">
            <div class="dash-icon">📦</div>
            <div class="dash-content">
                <h3>{{ __('app.home_open_packs') }}</h3>
                <p>{{ __('app.home_open_packs_desc') }}</p>
            </div>
            <div class="dash-arrow">→</div>
        </div>
        <div class="dashboard-card glass-card" onclick="window.location.hash='#collection'">
            <div class="dash-icon">🃏</div>
            <div class="dash-content">
                <h3>{{ __('app.home_collection') }}</h3>
                <p>{{ __('app.home_collection_desc') }}</p>
            </div>
            <div class="dash-arrow">→</div>
        </div>
        <div class="dashboard-card glass-card" onclick="window.location.hash='#deck-builder'">
            <div class="dash-icon">📋</div>
            <div class="dash-content">
                <h3>{{ __('app.home_deck_builder') }}</h3>
                <p>{{ __('app.home_deck_builder_desc') }}</p>
            </div>
            <div class="dash-arrow">→</div>
        </div>
        <div class="dashboard-card glass-card" onclick="window.location.hash='#shop'">
            <div class="dash-icon">🏪</div>
            <div class="dash-content">
                <h3>{{ __('app.home_shop') }}</h3>
                <p>{{ __('app.home_shop_desc') }}</p>
            </div>
            <div class="dash-arrow">→</div>
        </div>
    </div>
</div>
