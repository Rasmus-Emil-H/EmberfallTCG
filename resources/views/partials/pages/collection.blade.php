<!-- COLLECTION PAGE -->
<div id="collection-page" class="page">
    <div class="page-header">
        <h2>🃏 {{ __('app.collection_title') }}</h2>
        <p>{{ __('app.collection_cards_owned') }} <span id="collection-count">0</span></p>
    </div>

    <div class="collection-filters">
        <span style="color:var(--text-secondary);font-size:0.8rem;font-weight:500;text-transform:uppercase;letter-spacing:0.08em;">{{ __('app.collection_rarity') }}</span>
        <button class="filter-btn collection-filter-rarity active" data-rarity="all">{{ __('app.collection_all') }}</button>
        @foreach($rarities as $rarity)
        <button class="filter-btn collection-filter-rarity rarity-{{ $rarity }}" data-rarity="{{ $rarity }}">{{ ucfirst($rarity) }}</button>
        @endforeach
    </div>

    <div class="collection-filters">
        <span style="color:var(--text-secondary);font-size:0.8rem;font-weight:500;text-transform:uppercase;letter-spacing:0.08em;">{{ __('app.collection_class') }}</span>
        <button class="filter-btn collection-filter-class active" data-class="all">{{ __('app.collection_all') }}</button>
        @foreach($heroClasses as $cls)
        <button class="filter-btn collection-filter-class" data-class="{{ $cls['key'] }}">{{ $cls['emoji'] }} {{ ucfirst($cls['key']) }}</button>
        @endforeach
    </div>

    <div id="collection-cards-grid" class="cards-grid">
        <!-- Cards rendered by JS -->
    </div>
</div>
