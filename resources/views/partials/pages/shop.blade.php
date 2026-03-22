<!-- SHOP PAGE -->
<div id="shop-page" class="page">
    <div class="page-header">
        <h2>🏪 {{ __('app.shop_title') }}</h2>
        <p>{{ __('app.shop_subtitle') }}</p>
    </div>

    <div class="shop-hero gold-shop">
        <div class="gold-shop-info">
            <h3>{{ __('app.shop_need_gold') }}</h3>
            <p>{{ __('app.shop_gold_desc') }}</p>
        </div>
        <button class="btn btn-gold" id="buy-gold-btn" onclick="buyGold()">
            {{ __('app.shop_get_gold') }}
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
            <div class="pack-price">{{ $pack->price }} <span>{{ __('app.shop_gold_unit') }}</span></div>
            <button class="btn btn-primary btn-sm shop-buy-btn" data-pack-id="{{ $pack->id }}">{{ __('app.shop_open_pack') }}</button>
        </div>
        @endforeach
    </div>
</div>
