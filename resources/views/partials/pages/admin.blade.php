<!-- ADMIN PAGE -->
<div id="admin-page" class="page">
    <div class="page-header">
        <h2 class="page-title">🛡️ {{ __('app.admin_title') }}</h2>
        <p class="page-subtitle">{{ __('app.admin_subtitle') }}</p>
    </div>

    <!-- Tabs -->
    <div class="admin-tabs">
        <button class="admin-tab active" data-tab="dashboard">{{ __('app.admin_tab_dashboard') }}</button>
        <button class="admin-tab" data-tab="cards">{{ __('app.admin_tab_cards') }}</button>
        <button class="admin-tab" data-tab="users">{{ __('app.admin_tab_users') }}</button>
        <button class="admin-tab" data-tab="packs">{{ __('app.admin_tab_packs') }}</button>
        <button class="admin-tab" data-tab="translations">{{ __('app.admin_tab_translations') }}</button>
        <button class="admin-tab" data-tab="classes">⚔️ Classes</button>
    </div>

    <!-- Dashboard tab -->
    <div class="admin-panel active" id="admin-tab-dashboard">
        <div class="admin-stats-grid" id="admin-stats-grid">
            <!-- filled by JS -->
        </div>
        <div class="admin-two-col">
            <div class="glass-card">
                <h3 class="glass-card-title">{{ __('app.admin_recent_users') }}</h3>
                <div id="admin-recent-users"></div>
            </div>
            <div class="glass-card">
                <h3 class="glass-card-title">{{ __('app.admin_recent_games') }}</h3>
                <div id="admin-recent-games"></div>
            </div>
        </div>
    </div>

    <!-- Cards tab -->
    <div class="admin-panel" id="admin-tab-cards">
        <div class="admin-toolbar">
            <input type="text" id="admin-card-search" class="admin-search" placeholder="{{ __('app.admin_search_cards') }}">
            <button class="btn btn-primary btn-sm" id="admin-card-new-btn">{{ __('app.admin_new_card') }}</button>
        </div>
        <!-- Create / Edit form -->
        <div class="admin-form-card glass-card" id="admin-card-form-wrap" style="display:none">
            <h3 class="glass-card-title" id="admin-card-form-title">{{ __('app.admin_new_card_title') }}</h3>
            <form id="admin-card-form" class="admin-form-grid">
                <div class="form-group"><label>{{ __('app.admin_name') }}</label><input name="name" class="form-control" required></div>
                <div class="form-group"><label>{{ __('app.admin_mana_cost') }}</label><input name="mana_cost" type="number" min="0" max="20" class="form-control" required></div>
                <div class="form-group"><label>{{ __('app.admin_type') }}</label>
                    <select name="card_type" class="form-control">
                        <option value="minion">{{ __('app.admin_type_minion') }}</option>
                        <option value="spell">{{ __('app.admin_type_spell') }}</option>
                        <option value="weapon">⚔️ Weapon</option>
                    </select>
                </div>
                <div class="form-group"><label>{{ __('app.admin_class') }}</label>
                    <select name="hero_class" class="form-control">
                        @foreach($heroClasses as $cls)
                        <option value="{{ $cls['key'] }}">{{ $cls['emoji'] }} {{ ucfirst($cls['key']) }}</option>
                        @endforeach
                    </select>
                </div>
                <div class="form-group"><label>{{ __('app.admin_rarity') }}</label>
                    <select name="rarity" class="form-control">
                        @foreach($rarities as $rarity)
                        <option value="{{ $rarity }}">{{ ucfirst($rarity) }}</option>
                        @endforeach
                    </select>
                </div>
                <div class="form-group admin-card-stats" id="admin-card-stats-group">
                    <label>{{ __('app.admin_attack') }}</label><input name="attack" type="number" min="0" class="form-control" value="0">
                </div>
                <div class="form-group admin-card-stats" id="admin-card-health-group">
                    <label>{{ __('app.admin_health') }}</label><input name="health" type="number" min="1" class="form-control" value="1">
                </div>
                <div class="form-group" style="grid-column:1/-1"><label>{{ __('app.admin_description') }}</label><textarea name="description" class="form-control" rows="2"></textarea></div>
                <div class="form-group" style="grid-column:1/-1"><label>{{ __('app.admin_flavor_text') }}</label><input name="flavor_text" class="form-control"></div>
                <div class="admin-form-actions" style="grid-column:1/-1">
                    <button type="submit" class="btn btn-primary" id="admin-card-submit">{{ __('app.admin_save_card') }}</button>
                    <button type="button" class="btn btn-ghost" id="admin-card-cancel">{{ __('app.admin_cancel') }}</button>
                </div>
            </form>
        </div>
        <div class="admin-table-wrap">
            <table class="admin-table" id="admin-cards-table">
                <thead><tr>
                    <th>{{ __('app.admin_col_name') }}</th>
                    <th>{{ __('app.admin_col_class') }}</th>
                    <th>{{ __('app.admin_col_type') }}</th>
                    <th>{{ __('app.admin_col_rarity') }}</th>
                    <th>{{ __('app.admin_col_mana') }}</th>
                    <th>{{ __('app.admin_col_atk_hp') }}</th>
                    <th></th>
                </tr></thead>
                <tbody id="admin-cards-tbody"></tbody>
            </table>
        </div>
    </div>

    <!-- Users tab -->
    <div class="admin-panel" id="admin-tab-users">
        <div class="admin-toolbar">
            <input type="text" id="admin-user-search" class="admin-search" placeholder="{{ __('app.admin_search_users') }}">
        </div>
        <div class="admin-table-wrap">
            <table class="admin-table" id="admin-users-table">
                <thead><tr>
                    <th>{{ __('app.admin_col_id') }}</th>
                    <th>{{ __('app.admin_col_name2') }}</th>
                    <th>{{ __('app.admin_col_email') }}</th>
                    <th>{{ __('app.admin_col_gold') }}</th>
                    <th>{{ __('app.admin_col_rank') }}</th>
                    <th>{{ __('app.admin_col_roles') }}</th>
                    <th></th>
                </tr></thead>
                <tbody id="admin-users-tbody"></tbody>
            </table>
        </div>
        <!-- User edit modal -->
        <div class="admin-modal-overlay" id="admin-user-modal" style="display:none">
            <div class="admin-modal glass-card">
                <h3 class="glass-card-title">{{ __('app.admin_edit_user') }}</h3>
                <form id="admin-user-form" class="admin-form-grid">
                    <input type="hidden" name="id">
                    <div class="form-group"><label>{{ __('app.admin_name') }}</label><input name="name" class="form-control" required></div>
                    <div class="form-group"><label>{{ __('app.admin_email') }}</label><input name="email" type="email" class="form-control" required></div>
                    <div class="form-group"><label>{{ __('app.admin_gold') }}</label><input name="gold" type="number" min="0" class="form-control"></div>
                    <div class="form-group"><label>{{ __('app.admin_rank_points') }}</label><input name="rank_points" type="number" min="0" class="form-control"></div>
                    <div class="form-group" style="grid-column:1/-1">
                        <label>{{ __('app.admin_roles') }}</label>
                        <div class="admin-role-checks">
                            <label class="admin-role-check"><input type="checkbox" name="role_admin" value="admin"> {{ __('app.admin_role_admin') }}</label>
                            <label class="admin-role-check"><input type="checkbox" name="role_moderator" value="moderator"> {{ __('app.admin_role_moderator') }}</label>
                        </div>
                    </div>
                    <div class="admin-form-actions" style="grid-column:1/-1">
                        <button type="submit" class="btn btn-primary">{{ __('app.admin_save') }}</button>
                        <button type="button" class="btn btn-ghost" id="admin-user-cancel">{{ __('app.admin_cancel') }}</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Translations tab -->
    <div class="admin-panel" id="admin-tab-translations">
        <div class="admin-toolbar">
            <div class="admin-trans-locales" id="admin-trans-locales">
                <!-- locale toggle buttons filled by JS -->
            </div>
            <input type="text" id="admin-trans-search" class="admin-search" placeholder="{{ __('app.admin_search_translations') }}">
            <button class="btn btn-primary btn-sm" id="admin-trans-new-btn">{{ __('app.admin_new_translation') }}</button>
        </div>
        <!-- Add / Edit form -->
        <div class="admin-form-card glass-card" id="admin-trans-form-wrap" style="display:none">
            <h3 class="glass-card-title" id="admin-trans-form-title">{{ __('app.admin_new_translation') }}</h3>
            <form id="admin-trans-form" class="admin-form-grid">
                <div class="form-group"><label>{{ __('app.admin_trans_locale') }}</label><input name="locale" class="form-control" required placeholder="en"></div>
                <div class="form-group"><label>{{ __('app.admin_trans_key') }}</label><input name="key" class="form-control" required placeholder="nav_play"></div>
                <div class="form-group" style="grid-column:1/-1"><label>{{ __('app.admin_trans_value') }}</label><textarea name="value" class="form-control" rows="2" required></textarea></div>
                <div class="admin-form-actions" style="grid-column:1/-1">
                    <button type="submit" class="btn btn-primary" id="admin-trans-submit">{{ __('app.admin_save') }}</button>
                    <button type="button" class="btn btn-ghost" id="admin-trans-cancel">{{ __('app.admin_cancel') }}</button>
                </div>
            </form>
        </div>
        <div class="admin-table-wrap">
            <table class="admin-table" id="admin-trans-table">
                <thead><tr>
                    <th>{{ __('app.admin_trans_key') }}</th>
                    <th>{{ __('app.admin_trans_value') }}</th>
                    <th></th>
                </tr></thead>
                <tbody id="admin-trans-tbody"></tbody>
            </table>
        </div>
    </div>

    <!-- Packs tab -->
    <div class="admin-panel" id="admin-tab-packs">
        <div class="admin-toolbar">
            <button class="btn btn-primary btn-sm" id="admin-pack-new-btn">{{ __('app.admin_new_pack') }}</button>
        </div>
        <div class="admin-form-card glass-card" id="admin-pack-form-wrap" style="display:none">
            <h3 class="glass-card-title" id="admin-pack-form-title">{{ __('app.admin_new_pack_title') }}</h3>
            <form id="admin-pack-form" class="admin-form-grid">
                <div class="form-group"><label>{{ __('app.admin_name') }}</label><input name="name" class="form-control" required></div>
                <div class="form-group"><label>{{ __('app.admin_price_gold') }}</label><input name="price" type="number" min="0" class="form-control" required></div>
                <div class="form-group"><label>{{ __('app.admin_cards_per_pack') }}</label><input name="card_count" type="number" min="1" max="20" class="form-control" required></div>
                <div class="form-group"><label>{{ __('app.admin_set_name') }}</label><input name="set_name" class="form-control" required placeholder="{{ __('app.admin_set_placeholder') }}"></div>
                <div class="admin-form-actions" style="grid-column:1/-1">
                    <button type="submit" class="btn btn-primary" id="admin-pack-submit">{{ __('app.admin_save_pack') }}</button>
                    <button type="button" class="btn btn-ghost" id="admin-pack-cancel">{{ __('app.admin_cancel') }}</button>
                </div>
            </form>
        </div>
        <div class="admin-table-wrap">
            <table class="admin-table" id="admin-packs-table">
                <thead><tr>
                    <th>{{ __('app.admin_col_name') }}</th>
                    <th>{{ __('app.admin_col_set') }}</th>
                    <th>{{ __('app.admin_col_price') }}</th>
                    <th>{{ __('app.admin_col_cards') }}</th>
                    <th>{{ __('app.admin_col_times_opened') }}</th>
                    <th></th>
                </tr></thead>
                <tbody id="admin-packs-tbody"></tbody>
            </table>
        </div>
    </div>

    <!-- Classes tab -->
    <div class="admin-panel" id="admin-tab-classes">
        <div class="admin-toolbar">
            <button class="btn btn-primary btn-sm" id="admin-class-new-btn">+ New Class</button>
        </div>
        <div class="admin-form-card glass-card" id="admin-class-form-wrap" style="display:none">
            <h3 class="glass-card-title" id="admin-class-form-title">New Class</h3>
            <form id="admin-class-form" class="admin-form-grid">
                <div class="form-group"><label>Key (slug)</label><input name="key" class="form-control" required placeholder="e.g. warrior" pattern="[a-z0-9_]+"></div>
                <div class="form-group"><label>Display Name</label><input name="name" class="form-control" required placeholder="e.g. Warrior"></div>
                <div class="form-group"><label>Emoji</label><input name="emoji" class="form-control" required placeholder="⚔️" maxlength="10"></div>
                <div class="form-group"><label>Sort Order</label><input name="sort_order" type="number" min="0" class="form-control" value="10"></div>
                <div class="form-group" style="grid-column:1/-1"><label>CSS Gradient</label><input name="gradient" class="form-control" required placeholder="linear-gradient(160deg,#7f1d1d,#b45309)"></div>
                <div class="form-group" style="grid-column:1/-1"><label>Description</label><textarea name="description" class="form-control" rows="2" placeholder="Short description of this class..."></textarea></div>
                <div class="form-group" style="grid-column:1/-1" id="admin-class-image-group" style="display:none">
                    <label>Portrait Image (PNG/JPG, max 2MB)</label>
                    <input type="file" name="image" id="admin-class-image-input" accept="image/*" class="form-control">
                    <small style="color:var(--text-muted)">Upload after saving the class. Shown in-game as the hero portrait.</small>
                </div>
                <div class="admin-form-actions" style="grid-column:1/-1">
                    <button type="submit" class="btn btn-primary" id="admin-class-submit">Save</button>
                    <button type="button" class="btn btn-ghost" id="admin-class-cancel">Cancel</button>
                </div>
            </form>
        </div>
        <div class="admin-table-wrap">
            <table class="admin-table" id="admin-classes-table">
                <thead><tr>
                    <th>Class</th>
                    <th>Key</th>
                    <th>Gradient Preview</th>
                    <th>Description</th>
                    <th>Cards</th>
                    <th></th>
                </tr></thead>
                <tbody id="admin-classes-tbody"></tbody>
            </table>
        </div>
    </div>
</div>
