<!-- LOGIN PAGE -->
<div id="login-page" class="page">
    <div class="auth-container">
        <div class="auth-card">
            <h1 class="auth-title">⚔️ REALM WARS</h1>
            <p class="auth-subtitle">{{ __('app.login_subtitle') }}</p>
            <form id="login-form">
                <div class="input-float">
                    <input type="email" id="login-email" placeholder=" " required autocomplete="email">
                    <label for="login-email">{{ __('app.login_email') }}</label>
                </div>
                <div class="input-float">
                    <input type="password" id="login-password" placeholder=" " required autocomplete="current-password">
                    <label for="login-password">{{ __('app.login_password') }}</label>
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%;padding:14px;font-size:0.9rem;">{{ __('app.login_submit') }}</button>
            </form>
            <div class="auth-divider">{{ __('app.login_no_account') }}</div>
            <a href="#register" class="btn btn-gold" style="text-align:center;display:block;width:100%;">{{ __('app.login_create_account') }}</a>
            <div style="margin-top:16px;text-align:center;font-size:0.78rem;color:var(--text-muted);">
                {{ __('app.login_test_account') }}
            </div>
        </div>
    </div>
</div>
