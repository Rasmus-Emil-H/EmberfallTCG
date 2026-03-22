<!-- STATS PAGE -->
<div id="stats-page" class="page">
    <div class="page-header">
        <h2 class="page-title">📊 {{ __('app.stats_title') }}</h2>
        <p class="page-subtitle">{{ __('app.stats_subtitle') }}</p>
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
        <div class="stat-card"><div class="stat-icon">⚔️</div><div class="stat-value" id="stat-games">—</div><div class="stat-label">{{ __('app.stats_games_played') }}</div></div>
        <div class="stat-card"><div class="stat-icon">🏆</div><div class="stat-value stat-value--gold" id="stat-wins">—</div><div class="stat-label">{{ __('app.stats_victories') }}</div></div>
        <div class="stat-card"><div class="stat-icon">💀</div><div class="stat-value stat-value--red" id="stat-losses">—</div><div class="stat-label">{{ __('app.stats_defeats') }}</div></div>
        <div class="stat-card"><div class="stat-icon">📈</div><div class="stat-value" id="stat-winrate">—</div><div class="stat-label">{{ __('app.stats_win_rate') }}</div></div>
        <div class="stat-card"><div class="stat-icon">🔄</div><div class="stat-value" id="stat-turns">—</div><div class="stat-label">{{ __('app.stats_avg_turns') }}</div></div>
        <div class="stat-card"><div class="stat-icon">🃏</div><div class="stat-value" id="stat-cards-played">—</div><div class="stat-label">{{ __('app.stats_cards_played') }}</div></div>
    </div>

    <div class="stats-lower-grid">
        <!-- Streak -->
        <div class="glass-card">
            <h3 class="glass-card-title">{{ __('app.stats_current_streak') }}</h3>
            <div id="stats-streak" class="stats-streak-display"></div>
        </div>

        <!-- Top cards -->
        <div class="glass-card">
            <h3 class="glass-card-title">{{ __('app.stats_most_played') }}</h3>
            <div id="stats-top-cards" class="stats-top-cards"></div>
        </div>

        <!-- Class breakdown -->
        <div class="glass-card">
            <h3 class="glass-card-title">{{ __('app.stats_class_breakdown') }}</h3>
            <div id="stats-class-breakdown" class="stats-class-breakdown"></div>
        </div>

        <!-- Recent games -->
        <div class="glass-card stats-recent-span">
            <h3 class="glass-card-title">{{ __('app.stats_recent_games') }}</h3>
            <div id="stats-recent-games" class="stats-recent-games"></div>
        </div>

        <!-- Rank ladder -->
        <div class="glass-card stats-rank-span">
            <h3 class="glass-card-title">{{ __('app.stats_rank_ladder') }}</h3>
            <div class="rank-ladder-list">
                @foreach($rankTiers as $tier)
                <div class="rank-ladder-row" style="--rank-color:{{ $tier['color'] }}">
                    <span class="rlr-emoji">{{ $tier['emoji'] }}</span>
                    <span class="rlr-name">{{ $tier['name'] }}</span>
                    @if($tier['name'] !== 'Legend')
                    <span class="rlr-range">{{ __('app.stats_ranks_range') }}</span>
                    @else
                    <span class="rlr-range">{{ __('app.stats_top_ladder') }}</span>
                    @endif
                </div>
                @endforeach
            </div>
        </div>
    </div>
</div>
