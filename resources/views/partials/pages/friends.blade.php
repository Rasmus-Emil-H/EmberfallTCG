<!-- FRIENDS PAGE -->
<div id="friends-page" class="page">
    <div class="page-header">
        <h2 class="page-title">🤝 {{ __('app.friends_title') }}</h2>
        <p class="page-subtitle">{{ __('app.friends_subtitle') }}</p>
    </div>

    <!-- Search -->
    <div class="friends-search-bar">
        <input type="text" id="friends-search-input" class="form-control p-4" placeholder="{{ __('app.friends_search_ph') }}">
        <div class="friends-search-results glass-card" id="friends-search-results" style="display:none"></div>
    </div>

    <!-- Incoming challenges -->
    <div id="friends-challenges-section" style="display:none">
        <h3 class="friends-section-title">⚔️ {{ __('app.friends_challenge_in') }}</h3>
        <div id="friends-challenges-list" class="friends-list"></div>
    </div>

    <!-- Incoming friend requests -->
    <div id="friends-pending-section" style="display:none">
        <h3 class="friends-section-title">📨 {{ __('app.friends_pending_in') }}</h3>
        <div id="friends-pending-list" class="friends-list"></div>
    </div>

    <!-- Friends list -->
    <h3 class="friends-section-title">{{ __('app.friends_title') }}</h3>
    <div id="friends-list" class="friends-list">
        <div class="friends-empty" id="friends-empty">{{ __('app.friends_none') }}</div>
    </div>
</div>
