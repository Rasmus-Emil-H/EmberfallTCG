<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Realm Wars - Fantasy Card Game</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/css/app.css">
    <script type="importmap">
    {
        "imports": {
            "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
            "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
        }
    }
    </script>
    <script>
    window.APP_DATA = {!! json_encode([
        'packs'       => $packs,
        'heroClasses' => $heroClasses,
        'rarities'    => $rarities,
    ]) !!};
    </script>
</head>
<body>

<div class="bg-grid"></div>
<div class="orb orb-1"></div>
<div class="orb orb-2"></div>
<div class="orb orb-3"></div>

<!-- ===== NAVIGATION ===== -->
<nav id="nav">
    <div class="nav-logo"><span class="logo-realm">REALM</span><span class="logo-wars">WARS</span></div>
    <div class="nav-links">
        <a href="#" class="nav-link" data-page="home" data-auth="required">Home</a>
        <a href="#" class="nav-link" data-page="collection" data-auth="required">Collection</a>
        <a href="#" class="nav-link" data-page="open-packs" data-auth="required">Open Packs</a>
        <a href="#" class="nav-link" data-page="shop" data-auth="required">Shop</a>
        <a href="#" class="nav-link" data-page="decks" data-auth="required">Decks</a>
        <a href="#" class="nav-link" data-page="game" data-auth="required">Play</a>
        <a href="#" class="nav-link" data-page="stats" data-auth="required">Stats</a>
        <a href="#" class="nav-link" data-page="options" data-auth="required">⚙️</a>
        <a href="#" class="nav-link nav-link--admin" data-page="admin" data-auth="admin" style="display:none">🛡️ Admin</a>
        <a href="#" class="nav-link" data-page="login" data-auth="guest">Login</a>
        <a href="#" class="nav-link" data-page="register" data-auth="guest">Register</a>
        <button id="logout-btn" data-auth="required">Logout</button>
    </div>
    <div class="nav-rank" id="nav-rank" data-auth="required">
        <span id="rank-badge" class="rank-badge">🥉</span>
        <span id="rank-label">Bronze 10</span>
    </div>
    <div class="nav-gold" data-auth="required">
        <span class="gold-icon">🪙</span>
        <span id="gold-display">0</span>
    </div>
</nav>

<!-- ===== APP ===== -->
<div id="app">

    <!-- LOGIN PAGE -->
    <div id="login-page" class="page">
        <div class="auth-container">
            <div class="auth-card">
                <h1 class="auth-title">⚔️ REALM WARS</h1>
                <p class="auth-subtitle">Enter the realm, Champion</p>
                <form id="login-form">
                    <div class="input-float">
                        <input type="email" id="login-email" placeholder=" " required autocomplete="email">
                        <label for="login-email">Email</label>
                    </div>
                    <div class="input-float">
                        <input type="password" id="login-password" placeholder=" " required autocomplete="current-password">
                        <label for="login-password">Password</label>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width:100%;padding:14px;font-size:0.9rem;">Enter the Realm</button>
                </form>
                <div class="auth-divider">No account yet?</div>
                <a href="#register" class="btn btn-gold" style="text-align:center;display:block;width:100%;">Create Account</a>
                <div style="margin-top:16px;text-align:center;font-size:0.78rem;color:var(--text-muted);">
                    Test account: test@test.com / password
                </div>
            </div>
        </div>
    </div>

    <!-- REGISTER PAGE -->
    <div id="register-page" class="page">
        <div class="auth-container">
            <div class="auth-card">
                <h1 class="auth-title">⚔️ JOIN</h1>
                <p class="auth-subtitle">Create your legend</p>
                <form id="register-form">
                    <div class="input-float">
                        <input type="text" id="reg-name" placeholder=" " required>
                        <label for="reg-name">Champion Name</label>
                    </div>
                    <div class="input-float">
                        <input type="email" id="reg-email" placeholder=" " required autocomplete="email">
                        <label for="reg-email">Email</label>
                    </div>
                    <div class="input-float">
                        <input type="password" id="reg-password" placeholder=" " required autocomplete="new-password">
                        <label for="reg-password">Password (min. 6 characters)</label>
                    </div>
                    <div class="input-float">
                        <input type="password" id="reg-password-confirm" placeholder=" " required autocomplete="new-password">
                        <label for="reg-password-confirm">Confirm Password</label>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width:100%;padding:14px;font-size:0.9rem;">Join the Realm</button>
                </form>
                <div class="auth-divider">Already a champion?</div>
                <a href="#login" class="btn btn-gold" style="text-align:center;display:block;width:100%;">Sign In</a>
            </div>
        </div>
    </div>

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
            <a href="#game" class="btn btn-primary rank-hero-play">⚔️ Play Ranked</a>
        </div>

        <div class="dashboard-grid">
            <div class="dashboard-card glass-card" onclick="window.location.hash='#game'">
                <div class="dash-icon">⚔️</div>
                <div class="dash-content">
                    <h3>Battle</h3>
                    <p>Enter the arena and face opponents in real-time PvP combat</p>
                </div>
                <div class="dash-arrow">→</div>
            </div>
            <div class="dashboard-card glass-card" onclick="window.location.hash='#open-packs'">
                <div class="dash-icon">📦</div>
                <div class="dash-content">
                    <h3>Open Packs</h3>
                    <p>Unlock new cards with stunning 3D pack opening animations</p>
                </div>
                <div class="dash-arrow">→</div>
            </div>
            <div class="dashboard-card glass-card" onclick="window.location.hash='#collection'">
                <div class="dash-icon">🃏</div>
                <div class="dash-content">
                    <h3>Collection</h3>
                    <p>Browse your card collection and discover powerful combos</p>
                </div>
                <div class="dash-arrow">→</div>
            </div>
            <div class="dashboard-card glass-card" onclick="window.location.hash='#deck-builder'">
                <div class="dash-icon">📋</div>
                <div class="dash-content">
                    <h3>Deck Builder</h3>
                    <p>Craft the perfect deck strategy to dominate the battlefield</p>
                </div>
                <div class="dash-arrow">→</div>
            </div>
            <div class="dashboard-card glass-card" onclick="window.location.hash='#shop'">
                <div class="dash-icon">🏪</div>
                <div class="dash-content">
                    <h3>Shop</h3>
                    <p>Spend your gold on card packs to expand your collection</p>
                </div>
                <div class="dash-arrow">→</div>
            </div>
        </div>
    </div>

    <!-- SHOP PAGE -->
    <div id="shop-page" class="page">
        <div class="page-header">
            <h2>🏪 The Arcane Shop</h2>
            <p>Spend your gold to acquire powerful new cards</p>
        </div>

        <div class="shop-hero gold-shop">
            <div class="gold-shop-info">
                <h3>Need More Gold?</h3>
                <p>Get 500 bonus gold to fuel your collection</p>
            </div>
            <button class="btn btn-gold" id="buy-gold-btn" onclick="buyGold()">
                💰 Get 500 Gold (Free!)
            </button>
        </div>

        <div id="shop-packs-grid" class="shop-grid">
            @foreach($packs as $pack)
            @php
                $emoji = str_contains(strtolower($pack->name),'legendary') ? '✨' : (str_contains(strtolower($pack->name),'arcane') ? '🔮' : '📦');
                $artClass = str_contains(strtolower($pack->name),'legendary') ? 'legendary' : (str_contains(strtolower($pack->name),'arcane') ? 'arcane' : 'starter');
                $setLabels = ['realm_wars_core'=>'Core Set','arcane_collection'=>'Arcane Collection','legendary_trove'=>'Legendary Trove'];
                $setLabel = $setLabels[$pack->set_name] ?? $pack->set_name;
            @endphp
            <div class="pack-card shop-pack-card"
                 data-pack-id="{{ $pack->id }}"
                 data-pack-price="{{ $pack->price }}"
                 data-pack-name="{{ e($pack->name) }}">
                <div class="pack-art {{ $artClass }}">{{ $emoji }}</div>
                <div class="pack-name">{{ $pack->name }}</div>
                <div class="pack-desc">{{ $pack->card_count }} cards per pack · {{ $setLabel }}</div>
                <div class="pack-price">{{ $pack->price }} <span>Gold</span></div>
                <button class="btn btn-primary btn-sm shop-buy-btn" data-pack-id="{{ $pack->id }}">Open Pack</button>
            </div>
            @endforeach
        </div>
    </div>

    <!-- COLLECTION PAGE -->
    <div id="collection-page" class="page">
        <div class="page-header">
            <h2>🃏 My Collection</h2>
            <p>Cards owned: <span id="collection-count">0</span></p>
        </div>

        <div class="collection-filters">
            <span style="color:var(--text-secondary);font-size:0.8rem;font-weight:500;text-transform:uppercase;letter-spacing:0.08em;">Rarity:</span>
            <button class="filter-btn collection-filter-rarity active" data-rarity="all">All</button>
            @foreach($rarities as $rarity)
            <button class="filter-btn collection-filter-rarity rarity-{{ $rarity }}" data-rarity="{{ $rarity }}">{{ ucfirst($rarity) }}</button>
            @endforeach
        </div>

        <div class="collection-filters">
            <span style="color:var(--text-secondary);font-size:0.8rem;font-weight:500;text-transform:uppercase;letter-spacing:0.08em;">Class:</span>
            <button class="filter-btn collection-filter-class active" data-class="all">All</button>
            @foreach($heroClasses as $cls)
            <button class="filter-btn collection-filter-class" data-class="{{ $cls['key'] }}">{{ $cls['emoji'] }} {{ ucfirst($cls['key']) }}</button>
            @endforeach
        </div>

        <div id="collection-cards-grid" class="cards-grid">
            <!-- Cards rendered by JS -->
        </div>
    </div>

    <!-- PACK OPENING PAGE -->
    <div id="open-packs-page" class="page">
        <div class="pack-opening-container">
            <div class="page-header">
                <h2>📦 Open Packs</h2>
                <p>Select a pack and reveal your new cards in glorious 3D!</p>
            </div>

            <div class="pack-selection">
                <div id="pack-selection-grid" class="pack-selection-grid">
                    @foreach($packs as $pack)
                    @php $emoji = str_contains(strtolower($pack->name),'legendary') ? '✨' : (str_contains(strtolower($pack->name),'arcane') ? '🔮' : '📦'); @endphp
                    <div class="pack-option"
                         data-pack-id="{{ $pack->id }}"
                         data-pack-price="{{ $pack->price }}"
                         data-pack-name="{{ e($pack->name) }}">
                        <div class="pack-emoji">{{ $emoji }}</div>
                        <div class="pack-option-name">{{ $pack->name }}</div>
                        <div class="pack-option-price">{{ $pack->price }} Gold</div>
                    </div>
                    @endforeach
                </div>
            </div>

            <button id="pack-open-btn" class="btn btn-purple" style="min-width:200px;margin:0 auto;display:block;">
                ✨ Open Pack
            </button>

        </div>
    </div>

    <!-- GAME PAGE -->
    <div id="game-page" class="page game-page-fullscreen">

        <!-- Matchmaking Screen -->
        <div id="matchmaking-overlay" class="matchmaking-overlay">
            <div class="matchmaking-card">
                <div class="matchmaking-icon">⚔️</div>
                <h2>Finding Match</h2>
                <div class="matchmaking-spinner"></div>
                <p class="matchmaking-status">Searching for a worthy opponent...</p>
                <button class="btn btn-ghost btn-sm" onclick="window.location.hash='#home'">Cancel</button>
            </div>
        </div>

        <!-- Active Game UI (hidden until match found) -->
        <div id="game-active" style="display:none;width:100%;height:100%;flex-direction:column;">

            <!-- Top: Opponent info bar -->
            <div class="game-top-bar">
                <div class="game-hero-info opponent">
                    <div class="hero-avatar opponent-avatar">👤</div>
                    <div class="hero-details">
                        <span class="hero-name" id="opponent-name">Opponent</span>
                        <div class="hero-hp-bar">
                            <div class="hero-hp-fill opponent-hp-fill" id="opponent-hp-fill" style="width:100%"></div>
                            <span class="hero-hp-text" id="opponent-hp">30</span>
                        </div>
                    </div>
                </div>
                <div id="game-turn-indicator" class="game-turn-indicator">Waiting...</div>
                <div class="game-hero-info player">
                    <div class="hero-details" style="align-items:flex-end;">
                        <span class="hero-name" id="player-name-display">You</span>
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
                            <span class="hero-portrait-emoji">👤</span>
                            <div class="hero-portrait-hp" id="portrait-opp-hp">30</div>
                        </div>
                        <!-- Opponent game log (spells + deaths) -->
                        <div class="spell-log-wrap spell-log-wrap--opp" id="opp-log-wrap">
                            <div class="spell-log-badge" id="opp-log-badge">
                                <span class="spell-log-icon">📜</span>
                                <span class="spell-log-count" id="opp-log-count">0</span>
                            </div>
                            <div class="spell-log-popup" id="opp-log-popup">
                                <div class="spell-log-title">OPPONENT LOG</div>
                                <div class="spell-log-list" id="opp-log-list">
                                    <div class="spell-log-empty">Nothing yet</div>
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
                        <div class="play-zone-hint" id="play-zone-hint">Drop card here to play</div>
                    </div>

                    <!-- Player hero zone -->
                    <div class="board-hero-row board-hero-row--bottom">
                        <div class="board-hero-portrait player-portrait" id="player-portrait">
                            <span class="hero-portrait-emoji">🧙</span>
                            <div class="hero-portrait-hp" id="portrait-my-hp">30</div>
                        </div>
                        <!-- Player game log (spells + deaths) -->
                        <div class="spell-log-wrap spell-log-wrap--player" id="my-log-wrap">
                            <div class="spell-log-badge" id="my-log-badge">
                                <span class="spell-log-icon">📜</span>
                                <span class="spell-log-count" id="my-log-count">0</span>
                            </div>
                            <div class="spell-log-popup" id="my-log-popup">
                                <div class="spell-log-title">YOUR LOG</div>
                                <div class="spell-log-list" id="my-log-list">
                                    <div class="spell-log-empty">Nothing yet</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right: Deck sidebar -->
                <div class="game-deck-sidebar">
                    <div class="deck-sidebar-label">YOUR DECK</div>
                    <div class="deck-stack" id="deck-stack">
                        <div class="deck-card-back deck-back-3"></div>
                        <div class="deck-card-back deck-back-2"></div>
                        <div class="deck-card-back deck-back-1"></div>
                    </div>
                    <div class="deck-count-badge" id="deck-count-display">30</div>
                    <div class="deck-sidebar-label" style="font-size:0.65rem;margin-top:4px;">CARDS LEFT</div>

                    <div style="flex:1;"></div>

                    <!-- Mana display -->
                    <div class="sidebar-mana">
                        <div class="sidebar-mana-label">MANA</div>
                        <div id="game-mana-display" class="mana-display-sidebar"></div>
                    </div>

                    <div style="flex:1;"></div>

                    <!-- Controls -->
                    <div class="sidebar-controls">
                        <button id="end-turn-btn" class="btn btn-gold end-turn-btn" disabled>
                            <span class="end-turn-text">END TURN</span>
                            <span class="end-turn-sub" id="end-turn-sub">Opponent's turn</span>
                        </button>
                        <button id="surrender-btn" class="btn btn-danger btn-sm surrender-btn">Surrender</button>
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

    <!-- DECKS PAGE -->
    <div id="decks-page" class="page">
        <div class="page-header">
            <h2>📋 My Decks</h2>
        </div>
        <div style="text-align:center;margin-bottom:28px;">
            <button class="btn btn-primary" onclick="window.location.hash='#deck-builder'">+ Create New Deck</button>
        </div>
        <div id="decks-list-grid" class="decks-grid">
            <!-- Decks rendered by JS -->
        </div>
    </div>

    <!-- DECK BUILDER PAGE -->
    <div id="deck-builder-page" class="page" style="padding-top:80px;">
        <div class="page-header">
            <h2>🔨 Deck Builder</h2>
        </div>

        <div class="deck-builder-layout">
            <!-- Left: Card Browser -->
            <div class="deck-builder-cards">
                <div class="collection-filters" style="margin-bottom:15px;">
                    <button class="filter-btn deck-filter-class active" data-class="all">All</button>
                    @foreach($heroClasses->reject(fn($c) => $c['key'] === 'neutral') as $cls)
                    <button class="filter-btn deck-filter-class" data-class="{{ $cls['key'] }}">{{ $cls['emoji'] }} {{ ucfirst($cls['key']) }}</button>
                    @endforeach
                </div>
                <div id="deck-builder-cards-grid" class="cards-grid" style="grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));">
                    <!-- Cards -->
                </div>
            </div>

            <!-- Right: Deck Info + Card List -->
            <div class="deck-sidebar">
                <div class="deck-info">
                    <div class="form-group">
                        <label>Deck Name</label>
                        <input type="text" id="deck-name-input" value="My New Deck">
                    </div>
                    <div class="form-group">
                        <label>Hero Class</label>
                        <select id="deck-hero-class">
                            @foreach($heroClasses->reject(fn($c) => $c['key'] === 'neutral') as $cls)
                            <option value="{{ $cls['key'] }}">{{ $cls['emoji'] }} {{ ucfirst($cls['key']) }}</option>
                            @endforeach
                        </select>
                    </div>
                    <button id="save-deck-btn" class="btn btn-primary" style="width:100%;">Save Deck</button>
                </div>

                <div class="deck-list">
                    <div id="deck-card-count" class="deck-count"><span>0</span> / 30 cards</div>
                    <div id="deck-card-list">
                        <!-- Deck cards -->
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- STATS PAGE -->
    <div id="stats-page" class="page">
        <div class="page-header">
            <h2 class="page-title">📊 Statistics</h2>
            <p class="page-subtitle">Your battle history &amp; performance</p>
        </div>

        <!-- Current rank banner -->
        <div class="stats-rank-banner glass-card" id="stats-rank-banner">
            <div class="srb-emblem" id="srb-emblem">🥉</div>
            <div class="srb-info">
                <div class="srb-label" id="srb-label">Bronze 10</div>
                <div class="srb-stars" id="srb-stars"></div>
            </div>
            <div class="srb-right">
                <div class="srb-points" id="srb-points">0 pts</div>
                <div class="srb-next" id="srb-next">Next: Silver 10</div>
            </div>
        </div>

        <!-- Overview cards -->
        <div class="stats-overview-grid" id="stats-overview-grid">
            <div class="stat-card"><div class="stat-icon">⚔️</div><div class="stat-value" id="stat-games">—</div><div class="stat-label">Games Played</div></div>
            <div class="stat-card"><div class="stat-icon">🏆</div><div class="stat-value stat-value--gold" id="stat-wins">—</div><div class="stat-label">Victories</div></div>
            <div class="stat-card"><div class="stat-icon">💀</div><div class="stat-value stat-value--red" id="stat-losses">—</div><div class="stat-label">Defeats</div></div>
            <div class="stat-card"><div class="stat-icon">📈</div><div class="stat-value" id="stat-winrate">—</div><div class="stat-label">Win Rate</div></div>
            <div class="stat-card"><div class="stat-icon">🔄</div><div class="stat-value" id="stat-turns">—</div><div class="stat-label">Avg. Turns</div></div>
            <div class="stat-card"><div class="stat-icon">🃏</div><div class="stat-value" id="stat-cards-played">—</div><div class="stat-label">Cards Played</div></div>
        </div>

        <div class="stats-lower-grid">
            <!-- Streak -->
            <div class="glass-card">
                <h3 class="glass-card-title">Current Streak</h3>
                <div id="stats-streak" class="stats-streak-display"></div>
            </div>

            <!-- Top cards -->
            <div class="glass-card">
                <h3 class="glass-card-title">Most Played Cards</h3>
                <div id="stats-top-cards" class="stats-top-cards"></div>
            </div>

            <!-- Class breakdown -->
            <div class="glass-card">
                <h3 class="glass-card-title">Class Breakdown</h3>
                <div id="stats-class-breakdown" class="stats-class-breakdown"></div>
            </div>

            <!-- Recent games -->
            <div class="glass-card stats-recent-span">
                <h3 class="glass-card-title">Recent Games</h3>
                <div id="stats-recent-games" class="stats-recent-games"></div>
            </div>

            <!-- Rank ladder -->
            <div class="glass-card stats-rank-span">
                <h3 class="glass-card-title">Rank Ladder</h3>
                <div class="rank-ladder-list">
                    @foreach($rankTiers as $tier)
                    <div class="rank-ladder-row" style="--rank-color:{{ $tier['color'] }}">
                        <span class="rlr-emoji">{{ $tier['emoji'] }}</span>
                        <span class="rlr-name">{{ $tier['name'] }}</span>
                        @if($tier['name'] !== 'Legend')
                        <span class="rlr-range">Ranks 10–1 · 30 stars</span>
                        @else
                        <span class="rlr-range">Top of the ladder</span>
                        @endif
                    </div>
                    @endforeach
                </div>
            </div>
        </div>
    </div>

    <!-- OPTIONS PAGE -->
    <div id="options-page" class="page">
        <div class="page-header">
            <h2 class="page-title">⚙️ Settings</h2>
            <p class="page-subtitle">Manage your account &amp; preferences</p>
        </div>

        <div class="options-layout">
            <!-- Profile -->
            <div class="glass-card">
                <h3 class="glass-card-title">Profile</h3>
                <form id="profile-form" class="options-form">
                    <div class="form-group">
                        <label class="form-label">Display Name</label>
                        <input type="text" id="options-name" class="form-control" placeholder="Your name">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Email Address</label>
                        <input type="email" id="options-email" class="form-control" placeholder="you@example.com">
                    </div>
                    <button type="submit" class="btn btn-primary">Save Changes</button>
                </form>
            </div>

            <!-- Password -->
            <div class="glass-card">
                <h3 class="glass-card-title">Change Password</h3>
                <form id="password-form" class="options-form">
                    <div class="form-group">
                        <label class="form-label">Current Password</label>
                        <input type="password" id="options-current-pw" class="form-control" placeholder="••••••••">
                    </div>
                    <div class="form-group">
                        <label class="form-label">New Password</label>
                        <input type="password" id="options-new-pw" class="form-control" placeholder="••••••••">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Confirm New Password</label>
                        <input type="password" id="options-confirm-pw" class="form-control" placeholder="••••••••">
                    </div>
                    <button type="submit" class="btn btn-primary">Update Password</button>
                </form>
            </div>

            <!-- Appearance -->
            <div class="glass-card">
                <h3 class="glass-card-title">Appearance</h3>
                <div class="options-theme-row">
                    <div>
                        <div class="options-label">Theme</div>
                        <div class="options-desc">Switch between dark and light mode</div>
                    </div>
                    <div class="theme-toggle" id="theme-toggle">
                        <button class="theme-btn" data-theme="dark" id="theme-btn-dark">🌙 Dark</button>
                        <button class="theme-btn" data-theme="light" id="theme-btn-light">☀️ Light</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- ADMIN PAGE -->
    <div id="admin-page" class="page">
        <div class="page-header">
            <h2 class="page-title">🛡️ Admin Panel</h2>
            <p class="page-subtitle">Manage the realm</p>
        </div>

        <!-- Tabs -->
        <div class="admin-tabs">
            <button class="admin-tab active" data-tab="dashboard">📊 Dashboard</button>
            <button class="admin-tab" data-tab="cards">🃏 Cards</button>
            <button class="admin-tab" data-tab="users">👥 Users</button>
            <button class="admin-tab" data-tab="packs">📦 Packs</button>
        </div>

        <!-- Dashboard tab -->
        <div class="admin-panel active" id="admin-tab-dashboard">
            <div class="admin-stats-grid" id="admin-stats-grid">
                <!-- filled by JS -->
            </div>
            <div class="admin-two-col">
                <div class="glass-card">
                    <h3 class="glass-card-title">Recent Users</h3>
                    <div id="admin-recent-users"></div>
                </div>
                <div class="glass-card">
                    <h3 class="glass-card-title">Recent Games</h3>
                    <div id="admin-recent-games"></div>
                </div>
            </div>
        </div>

        <!-- Cards tab -->
        <div class="admin-panel" id="admin-tab-cards">
            <div class="admin-toolbar">
                <input type="text" id="admin-card-search" class="admin-search" placeholder="Search cards…">
                <button class="btn btn-primary btn-sm" id="admin-card-new-btn">+ New Card</button>
            </div>
            <!-- Create / Edit form -->
            <div class="admin-form-card glass-card" id="admin-card-form-wrap" style="display:none">
                <h3 class="glass-card-title" id="admin-card-form-title">New Card</h3>
                <form id="admin-card-form" class="admin-form-grid">
                    <div class="form-group"><label>Name</label><input name="name" class="form-control" required></div>
                    <div class="form-group"><label>Mana Cost</label><input name="mana_cost" type="number" min="0" max="20" class="form-control" required></div>
                    <div class="form-group"><label>Type</label>
                        <select name="card_type" class="form-control">
                            <option value="minion">Minion</option>
                            <option value="spell">Spell</option>
                        </select>
                    </div>
                    <div class="form-group"><label>Class</label>
                        <select name="hero_class" class="form-control">
                            @foreach($heroClasses as $cls)
                            <option value="{{ $cls['key'] }}">{{ $cls['emoji'] }} {{ ucfirst($cls['key']) }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="form-group"><label>Rarity</label>
                        <select name="rarity" class="form-control">
                            @foreach($rarities as $rarity)
                            <option value="{{ $rarity }}">{{ ucfirst($rarity) }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="form-group admin-card-stats" id="admin-card-stats-group">
                        <label>Attack</label><input name="attack" type="number" min="0" class="form-control" value="0">
                    </div>
                    <div class="form-group admin-card-stats" id="admin-card-health-group">
                        <label>Health</label><input name="health" type="number" min="1" class="form-control" value="1">
                    </div>
                    <div class="form-group" style="grid-column:1/-1"><label>Description</label><textarea name="description" class="form-control" rows="2"></textarea></div>
                    <div class="form-group" style="grid-column:1/-1"><label>Flavor Text</label><input name="flavor_text" class="form-control"></div>
                    <div class="admin-form-actions" style="grid-column:1/-1">
                        <button type="submit" class="btn btn-primary" id="admin-card-submit">Save Card</button>
                        <button type="button" class="btn btn-ghost" id="admin-card-cancel">Cancel</button>
                    </div>
                </form>
            </div>
            <div class="admin-table-wrap">
                <table class="admin-table" id="admin-cards-table">
                    <thead><tr><th>Name</th><th>Class</th><th>Type</th><th>Rarity</th><th>Mana</th><th>ATK/HP</th><th></th></tr></thead>
                    <tbody id="admin-cards-tbody"></tbody>
                </table>
            </div>
        </div>

        <!-- Users tab -->
        <div class="admin-panel" id="admin-tab-users">
            <div class="admin-toolbar">
                <input type="text" id="admin-user-search" class="admin-search" placeholder="Search users…">
            </div>
            <div class="admin-table-wrap">
                <table class="admin-table" id="admin-users-table">
                    <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Gold</th><th>Rank</th><th>Roles</th><th></th></tr></thead>
                    <tbody id="admin-users-tbody"></tbody>
                </table>
            </div>
            <!-- User edit modal -->
            <div class="admin-modal-overlay" id="admin-user-modal" style="display:none">
                <div class="admin-modal glass-card">
                    <h3 class="glass-card-title">Edit User</h3>
                    <form id="admin-user-form" class="admin-form-grid">
                        <input type="hidden" name="id">
                        <div class="form-group"><label>Name</label><input name="name" class="form-control" required></div>
                        <div class="form-group"><label>Email</label><input name="email" type="email" class="form-control" required></div>
                        <div class="form-group"><label>Gold</label><input name="gold" type="number" min="0" class="form-control"></div>
                        <div class="form-group"><label>Rank Points</label><input name="rank_points" type="number" min="0" class="form-control"></div>
                        <div class="form-group" style="grid-column:1/-1">
                            <label>Roles</label>
                            <div class="admin-role-checks">
                                <label class="admin-role-check"><input type="checkbox" name="role_admin" value="admin"> Administrator</label>
                                <label class="admin-role-check"><input type="checkbox" name="role_moderator" value="moderator"> Moderator</label>
                            </div>
                        </div>
                        <div class="admin-form-actions" style="grid-column:1/-1">
                            <button type="submit" class="btn btn-primary">Save</button>
                            <button type="button" class="btn btn-ghost" id="admin-user-cancel">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Packs tab -->
        <div class="admin-panel" id="admin-tab-packs">
            <div class="admin-toolbar">
                <button class="btn btn-primary btn-sm" id="admin-pack-new-btn">+ New Pack</button>
            </div>
            <div class="admin-form-card glass-card" id="admin-pack-form-wrap" style="display:none">
                <h3 class="glass-card-title" id="admin-pack-form-title">New Pack</h3>
                <form id="admin-pack-form" class="admin-form-grid">
                    <div class="form-group"><label>Name</label><input name="name" class="form-control" required></div>
                    <div class="form-group"><label>Price (Gold)</label><input name="price" type="number" min="0" class="form-control" required></div>
                    <div class="form-group"><label>Cards Per Pack</label><input name="card_count" type="number" min="1" max="20" class="form-control" required></div>
                    <div class="form-group"><label>Set Name (slug)</label><input name="set_name" class="form-control" required placeholder="e.g. core_set"></div>
                    <div class="admin-form-actions" style="grid-column:1/-1">
                        <button type="submit" class="btn btn-primary" id="admin-pack-submit">Save Pack</button>
                        <button type="button" class="btn btn-ghost" id="admin-pack-cancel">Cancel</button>
                    </div>
                </form>
            </div>
            <div class="admin-table-wrap">
                <table class="admin-table" id="admin-packs-table">
                    <thead><tr><th>Name</th><th>Set</th><th>Price</th><th>Cards</th><th>Times Opened</th><th></th></tr></thead>
                    <tbody id="admin-packs-tbody"></tbody>
                </table>
            </div>
        </div>
    </div>

</div><!-- #app -->

<!-- PACK OPENING OVERLAY -->
<div id="pack-overlay" class="pack-overlay">
    <button class="pac-close" id="pac-close">✕</button>

    <!-- Stage 1: Sealed pack -->
    <div class="pac-stage" id="pac-stage-pack">
        <div class="pac-bg-glow" id="pac-bg-glow"></div>
        <div class="pac-pack-wrap" id="pac-pack-wrap">
            <div class="pac-ring pac-ring-outer"></div>
            <div class="pac-ring pac-ring-inner"></div>
            <div class="pac-pack" id="pac-pack">
                <div class="pac-pack-sheen"></div>
                <div class="pac-pack-symbol" id="pac-pack-symbol">📦</div>
                <div class="pac-pack-name" id="pac-pack-name">Starter Pack</div>
            </div>
        </div>
        <p class="pac-hint pac-hint--pulse">Click to open</p>
    </div>

    <!-- Stage 2: Card reveal -->
    <div class="pac-stage pac-stage--hidden" id="pac-stage-cards">
        <div class="pac-cards-row" id="pac-cards-row"></div>
        <p class="pac-hint" id="pac-cards-hint">Click each card to reveal</p>
        <button class="btn btn-gold pac-collect-btn" id="pac-collect-btn" style="display:none">✨ Collect Cards</button>
    </div>
</div>

<!-- Notifications Container -->
<div id="notifications"></div>

<!-- Loading Overlay -->
<div id="loading-overlay">
    <div class="loading-spinner"></div>
    <div class="loading-text">Loading...</div>
</div>

<!-- Modal -->
<div id="modal-overlay" class="modal-overlay">
    <div class="modal">
        <div class="modal-header">
            <h3 class="modal-title"></h3>
            <button class="modal-close" onclick="document.getElementById('modal-overlay').classList.remove('active')">×</button>
        </div>
        <div class="modal-body"></div>
    </div>
</div>

<script>
// Global buy gold function
async function buyGold() {
    const btn = document.getElementById('buy-gold-btn');
    btn.disabled = true;
    btn.textContent = 'Processing...';
    try {
        const response = await fetch('/api/shop/gold', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('auth_token'),
            }
        });
        const data = await response.json();
        if (response.ok) {
            document.getElementById('gold-display').textContent = data.gold.toLocaleString();
            // Store updated gold
            const user = JSON.parse(localStorage.getItem('realm_user') || '{}');
            user.gold = data.gold;
            localStorage.setItem('realm_user', JSON.stringify(user));

            // Show notification
            const note = document.createElement('div');
            note.className = 'notification success';
            note.textContent = '+500 Gold added!';
            document.getElementById('notifications').appendChild(note);
            setTimeout(() => note.remove(), 3500);
        }
    } catch (e) {
        console.error(e);
    } finally {
        btn.disabled = false;
        btn.textContent = '💰 Get 500 Gold (Free!)';
    }
}
</script>

<script type="module" src="/js/app.js"></script>

</body>
</html>
