<!-- SHOP PAGE -->
<div id="shop-page" class="page">
    <div class="page-header">
        <h2 class="page-title">🏪 {{ __('app.shop_title') }}</h2>
        <p class="page-subtitle">{{ __('app.shop_subtitle') }}</p>
    </div>

    <!-- Gold packages (real money) -->
    <div class="shop-section">
        <h3 class="shop-section-title">{{ __('app.shop_gold_packages') }}</h3>
        <p class="shop-section-desc">{{ __('app.shop_gold_packages_desc') }}</p>
        <div class="gold-packages-grid" id="gold-packages-grid">
            @php
                $packages = \App\Http\Controllers\QuickPayController::PACKAGES;
            @endphp
            @foreach($packages as $id => $pkg)
            <div class="gold-package{{ $pkg['popular'] ? ' popular' : '' }}" data-package-id="{{ $id }}">
                @if($pkg['popular'])
                <div class="gold-package-badge">Most Popular</div>
                @endif
                <div class="gold-package-emoji">{{ $pkg['emoji'] }}</div>
                <div class="gold-package-label">{{ $pkg['label'] }}</div>
                <div class="gold-package-amount">{{ number_format($pkg['gold']) }} <span>Gold</span></div>
                <div class="gold-package-price">{{ number_format($pkg['ore'] / 100, 0, ',', '.') }} DKK</div>
                <button class="btn btn-primary gold-package-btn" data-package-id="{{ $id }}">
                    {{ __('app.shop_buy_gold') }}
                </button>
            </div>
            @endforeach
        </div>
    </div>

    <!-- Free gold claim -->
    <div class="shop-hero gold-shop" id="free-gold-section">
        <div class="gold-shop-info">
            <h3>{{ __('app.shop_need_gold') }}</h3>
            <p>{{ __('app.shop_gold_desc') }}</p>
        </div>
        <button class="btn btn-gold" id="buy-gold-btn">
            {{ __('app.shop_get_gold') }}
        </button>
    </div>

    <!-- Card packs -->
    <div class="shop-section">
        <h3 class="shop-section-title">{{ __('app.shop_title') }}</h3>
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
                <div class="pack-price">{{ $pack->price }} <span>{{ __('app.shop_gold_unit') }}</span></div>
                <button class="btn btn-primary btn-sm shop-buy-btn" data-pack-id="{{ $pack->id }}">{{ __('app.shop_open_pack') }}</button>
            </div>
            @endforeach
        </div>
    </div>
</div>
