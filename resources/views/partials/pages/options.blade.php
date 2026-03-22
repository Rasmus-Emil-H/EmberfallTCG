<!-- OPTIONS PAGE -->
<div id="options-page" class="page">
    <div class="page-header">
        <h2 class="page-title">⚙️ {{ __('app.options_title') }}</h2>
        <p class="page-subtitle">{{ __('app.options_subtitle') }}</p>
    </div>

    <div class="options-layout">
        <!-- Profile -->
        <div class="glass-card">
            <h3 class="glass-card-title">{{ __('app.options_profile') }}</h3>
            <form id="profile-form" class="options-form">
                <div class="form-group">
                    <label class="form-label">{{ __('app.options_display_name') }}</label>
                    <input type="text" id="options-name" class="form-control" placeholder="{{ __('app.options_your_name') }}">
                </div>
                <div class="form-group">
                    <label class="form-label">{{ __('app.options_email_address') }}</label>
                    <input type="email" id="options-email" class="form-control" placeholder="{{ __('app.options_email_placeholder') }}">
                </div>
                <button type="submit" class="btn btn-primary">{{ __('app.options_save_changes') }}</button>
            </form>
        </div>

        <!-- Password -->
        <div class="glass-card">
            <h3 class="glass-card-title">{{ __('app.options_change_password') }}</h3>
            <form id="password-form" class="options-form">
                <div class="form-group">
                    <label class="form-label">{{ __('app.options_current_password') }}</label>
                    <input type="password" id="options-current-pw" class="form-control" placeholder="••••••••">
                </div>
                <div class="form-group">
                    <label class="form-label">{{ __('app.options_new_password') }}</label>
                    <input type="password" id="options-new-pw" class="form-control" placeholder="••••••••">
                </div>
                <div class="form-group">
                    <label class="form-label">{{ __('app.options_confirm_new_pw') }}</label>
                    <input type="password" id="options-confirm-pw" class="form-control" placeholder="••••••••">
                </div>
                <button type="submit" class="btn btn-primary">{{ __('app.options_update_password') }}</button>
            </form>
        </div>

        <!-- Appearance -->
        <div class="glass-card">
            <h3 class="glass-card-title">{{ __('app.options_appearance') }}</h3>
            <div class="options-theme-row">
                <div>
                    <div class="options-label">{{ __('app.options_theme') }}</div>
                    <div class="options-desc">{{ __('app.options_theme_desc') }}</div>
                </div>
                <div class="theme-toggle" id="theme-toggle">
                    <button class="theme-btn" data-theme="dark" id="theme-btn-dark">{{ __('app.options_dark') }}</button>
                    <button class="theme-btn" data-theme="light" id="theme-btn-light">{{ __('app.options_light') }}</button>
                </div>
            </div>

            <div class="options-theme-row" style="margin-top:20px;">
                <div>
                    <div class="options-label">{{ __('app.options_language') }}</div>
                    <div class="options-desc">{{ __('app.options_language_desc') }}</div>
                </div>
                <div class="drawer-lang" style="border-top:none;padding:0;">
                    <form method="POST" action="/language/en" style="display:inline">
                        @csrf
                        <button class="lang-btn {{ app()->getLocale() === 'en' ? 'active' : '' }}" type="submit">🇬🇧 EN</button>
                    </form>
                    <form method="POST" action="/language/da" style="display:inline">
                        @csrf
                        <button class="lang-btn {{ app()->getLocale() === 'da' ? 'active' : '' }}" type="submit">🇩🇰 DA</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>
