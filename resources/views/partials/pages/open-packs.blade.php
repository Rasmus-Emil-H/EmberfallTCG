<!-- PACK OPENING PAGE -->
<div id="open-packs-page" class="page">
    <div class="pack-opening-container">
        <div class="page-header">
            <h2>📦 {{ __('app.open_packs_title') }}</h2>
            <p>{{ __('app.open_packs_subtitle') }}</p>
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
                    <div class="pack-option-price">{{ $pack->price }} {{ __('app.open_packs_gold') }}</div>
                </div>
                @endforeach
            </div>
        </div>

        <button id="pack-open-btn" class="btn btn-purple" style="min-width:200px;margin:0 auto;display:block;">
            {{ __('app.open_pack_btn') }}
        </button>

    </div>
</div>
