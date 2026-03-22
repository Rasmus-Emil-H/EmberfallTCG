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
        <p class="pac-hint pac-hint--pulse">{{ __('app.pack_click_to_open') }}</p>
    </div>

    <!-- Stage 2: Card reveal -->
    <div class="pac-stage pac-stage--hidden" id="pac-stage-cards">
        <div class="pac-cards-row" id="pac-cards-row"></div>
        <p class="pac-hint" id="pac-cards-hint">{{ __('app.pack_click_each_card') }}</p>
        <button class="btn btn-gold pac-collect-btn" id="pac-collect-btn" style="display:none">{{ __('app.pack_collect') }}</button>
    </div>
</div>
