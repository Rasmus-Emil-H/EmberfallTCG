<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">
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
        'locale'      => $locale,
        't'           => [
            'victory'           => __('app.victory'),
            'defeat'            => __('app.defeat'),
            'you_conquered'     => __('app.you_conquered'),
            'better_luck'       => __('app.better_luck'),
            'return_home'       => __('app.return_home'),
            'play_again'        => __('app.play_again'),
            'rank_updating'     => __('app.rank_updating'),
            'star_earned'       => __('app.star_earned'),
            'searching'         => __('app.searching'),
            'match_found'       => __('app.match_found'),
        ],
    ]) !!};
    </script>
</head>
<body>

<div class="bg-grid"></div>
<div class="orb orb-1"></div>
<div class="orb orb-2"></div>
<div class="orb orb-3"></div>

@include('partials.nav')

<!-- ===== APP ===== -->
<div id="app">

    @include('partials.pages.login')

    @include('partials.pages.register')

    @include('partials.pages.home')

    @include('partials.pages.shop', ['packs' => $packs])

    @include('partials.pages.collection', ['heroClasses' => $heroClasses, 'rarities' => $rarities])

    @include('partials.pages.open-packs', ['packs' => $packs])

    @include('partials.pages.game')

    @include('partials.pages.decks')

    @include('partials.pages.deck-builder', ['heroClasses' => $heroClasses, 'rarities' => $rarities])

    @include('partials.pages.stats', ['rankTiers' => $rankTiers])

    @include('partials.pages.options')

    @include('partials.pages.admin', ['heroClasses' => $heroClasses, 'rarities' => $rarities])

</div><!-- #app -->

@include('partials.overlays.pack-overlay')

<!-- Notifications Container -->
<div id="notifications"></div>

<!-- Loading Overlay -->
<div id="loading-overlay">
    <div class="loading-spinner"></div>
    <div class="loading-text">{{ __('app.loading') }}</div>
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
