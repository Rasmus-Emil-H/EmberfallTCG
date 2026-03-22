<!-- DECK BUILDER PAGE -->
<div id="deck-builder-page" class="page" style="padding-top:80px;">
    <div class="page-header">
        <h2>🔨 {{ __('app.deck_builder_title') }}</h2>
    </div>

    <div class="deck-builder-layout">
        <!-- Left: Card Browser -->
        <div class="deck-builder-cards">
            <div class="collection-filters" style="margin-bottom:15px;">
                <button class="filter-btn deck-filter-class active" data-class="all">{{ __('app.deck_builder_all') }}</button>
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
                    <label>{{ __('app.deck_builder_name') }}</label>
                    <input type="text" id="deck-name-input" value="{{ __('app.deck_builder_new_name') }}">
                </div>
                <div class="form-group">
                    <label>{{ __('app.deck_builder_class') }}</label>
                    <select id="deck-hero-class">
                        @foreach($heroClasses->reject(fn($c) => $c['key'] === 'neutral') as $cls)
                        <option value="{{ $cls['key'] }}">{{ $cls['emoji'] }} {{ ucfirst($cls['key']) }}</option>
                        @endforeach
                    </select>
                </div>
                <button id="save-deck-btn" class="btn btn-primary" style="width:100%;">{{ __('app.deck_builder_save') }}</button>
            </div>

            <div class="deck-list">
                <div id="deck-card-count" class="deck-count"><span>0</span> {{ __('app.deck_builder_cards') }}</div>
                <div id="deck-card-list">
                    <!-- Deck cards -->
                </div>
            </div>
        </div>
    </div>
</div>
