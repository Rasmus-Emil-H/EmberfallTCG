<!-- REGISTER PAGE -->
<div id="register-page" class="page">
    <div class="auth-container">
        <div class="auth-card">
            <h1 class="auth-title">⚔️ JOIN</h1>
            <p class="auth-subtitle">{{ __('app.register_subtitle') }}</p>
            <form id="register-form">
                <div class="input-float">
                    <input type="text" id="reg-name" placeholder=" " required>
                    <label for="reg-name">{{ __('app.register_champion_name') }}</label>
                </div>
                <div class="input-float">
                    <input type="email" id="reg-email" placeholder=" " required autocomplete="email">
                    <label for="reg-email">{{ __('app.register_email') }}</label>
                </div>
                <div class="input-float">
                    <input type="password" id="reg-password" placeholder=" " required autocomplete="new-password">
                    <label for="reg-password">{{ __('app.register_password') }}</label>
                </div>
                <div class="input-float">
                    <input type="password" id="reg-password-confirm" placeholder=" " required autocomplete="new-password">
                    <label for="reg-password-confirm">{{ __('app.register_confirm_password') }}</label>
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%;padding:14px;font-size:0.9rem;">{{ __('app.register_submit') }}</button>
            </form>
            <div class="auth-divider">{{ __('app.register_already') }}</div>
            <a href="#login" class="btn btn-gold" style="text-align:center;display:block;width:100%;">{{ __('app.register_sign_in') }}</a>
        </div>
    </div>
</div>
