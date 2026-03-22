<!-- DECKS PAGE -->
<div id="decks-page" class="page">
    <div class="page-header">
        <h2>📋 {{ __('app.decks_title') }}</h2>
    </div>
    <div style="text-align:center;margin-bottom:28px;">
        <button class="btn btn-primary" onclick="window.location.hash='#deck-builder'">{{ __('app.decks_create_new') }}</button>
    </div>
    <div id="decks-list-grid" class="decks-grid">
        <!-- Decks rendered by JS -->
    </div>
</div>
