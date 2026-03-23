<!-- ===== NAVIGATION ===== -->
<nav id="nav">
    <button class="burger-btn" id="burger-btn" aria-label="Menu">
        <span></span><span></span><span></span>
    </button>
    <div class="nav-logo" onclick="window.location.hash='#home'">
        <span class="logo-realm">{{ strtoupper(config('app.name')) }}</span>
    </div>
    <div class="nav-right">
        <div class="nav-rank" id="nav-rank" data-auth="required">
            <span id="rank-badge" class="rank-badge">🥉</span>
            <span id="rank-label">Bronze 10</span>
        </div>
        <div class="nav-gold" data-auth="required">
            <span class="gold-icon">🪙</span>
            <span id="gold-display">0</span>
        </div>
    </div>
</nav>

<!-- Drawer overlay -->
<div class="drawer-overlay" id="drawer-overlay"></div>

<!-- Slide-in drawer -->
<aside class="nav-drawer" id="nav-drawer">
    <div class="drawer-header">
        <div class="nav-logo"><span class="logo-realm">REALM</span><span class="logo-wars">WARS</span></div>
        <button class="drawer-close" id="drawer-close">✕</button>
    </div>

    <nav class="drawer-links">
        <div class="drawer-section" data-auth="required">
            <div class="drawer-section-label">{{ __('app.nav_play') }}</div>
            <a href="#game"       class="drawer-link nav-link" data-page="game">⚔️ <span>{{ __('app.nav_battle') }}</span></a>
            <a href="#open-packs" class="drawer-link nav-link" data-page="open-packs">📦 <span>{{ __('app.nav_open_packs') }}</span></a>
        </div>
        <div class="drawer-section" data-auth="required">
            <div class="drawer-section-label">{{ __('app.nav_collection') }}</div>
            <a href="#collection"  class="drawer-link nav-link" data-page="collection">🃏 <span>{{ __('app.nav_my_cards') }}</span></a>
            <a href="#decks"       class="drawer-link nav-link" data-page="decks">📋 <span>{{ __('app.nav_my_decks') }}</span></a>
            <a href="#deck-builder" class="drawer-link nav-link" data-page="deck-builder">🔨 <span>{{ __('app.nav_deck_builder') }}</span></a>
        </div>
        <div class="drawer-section" data-auth="required">
            <div class="drawer-section-label">{{ __('app.nav_account') }}</div>
            <a href="#friends" class="drawer-link nav-link" data-page="friends">🤝 <span>{{ __('app.nav_friends') }}</span><span class="nav-badge" id="nav-friends-badge" style="display:none"></span></a>
            <a href="#shop"    class="drawer-link nav-link" data-page="shop">🏪 <span>{{ __('app.nav_shop') }}</span></a>
            <a href="#stats"   class="drawer-link nav-link" data-page="stats">📊 <span>{{ __('app.nav_statistics') }}</span></a>
            <a href="#options" class="drawer-link nav-link" data-page="options">⚙️ <span>{{ __('app.nav_settings') }}</span></a>
            <a href="#admin"   class="drawer-link nav-link nav-link--admin" data-page="admin" style="display:none">🛡️ <span>{{ __('app.nav_admin') }}</span></a>
        </div>
        <div class="drawer-section" data-auth="guest">
            <a href="#login"    class="drawer-link nav-link" data-page="login">🔑 <span>{{ __('app.nav_login') }}</span></a>
            <a href="#register" class="drawer-link nav-link" data-page="register">✨ <span>{{ __('app.nav_register') }}</span></a>
        </div>
    </nav>

    <div class="drawer-footer" data-auth="required">
        <button id="logout-btn" class="drawer-logout">{{ __('app.nav_sign_out') }}</button>
    </div>

    <div class="drawer-lang">
        <form method="POST" action="/language/en" style="display:inline">
            @csrf
            <button class="lang-btn {{ app()->getLocale() === 'en' ? 'active' : '' }}" type="submit">🇬🇧 EN</button>
        </form>
        <form method="POST" action="/language/da" style="display:inline">
            @csrf
            <button class="lang-btn {{ app()->getLocale() === 'da' ? 'active' : '' }}" type="submit">🇩🇰 DA</button>
        </form>
    </div>
</aside>
