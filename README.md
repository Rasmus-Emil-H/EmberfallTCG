Old project being bought "to life" since i have had some time on my hands (maternity leave)

# Realm Wars ⚔️

A browser-based fantasy card game built with Laravel 13 and Vanilla JS. Collect cards, build decks, and battle other players in real-time PvP matches — all wrapped in a dark, arcane aesthetic.

---

## Features

- **Real-time PvP battles** — turn-based card combat with live polling, minion board, and attack targeting
- **3D pack opening** — Three.js powered pack reveal animations with per-card flip effects
- **Deck builder** — construct 30-card decks filtered by class, rarity, and card type
- **Rank ladder** — Bronze 10 through Legend with a star-based progression system (win streaks award bonus stars)
- **Shop** — spend gold on card packs to expand your collection
- **Statistics** — win rate, streak, cards played, class breakdown, and rank history
- **Multi-language** — EN and DA, translations stored in the database and editable via the admin panel
- **Admin panel** — full CRUD for cards, packs, users, and translations; role-based access control
- **Responsive** — mobile-friendly layout with a slide-in drawer navigation

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 13, PHP 8.3 |
| Auth | Laravel Sanctum (token-based) |
| Database | SQLite (default) / any Laravel-supported DB |
| Frontend | Vanilla JS (ES modules), no framework |
| 3D | Three.js 0.160 (CDN import map) |
| Real-time | HTTP polling (Pusher-ready) |
| CSS | Custom properties, CSS Grid, Glassmorphism |

---

## Getting Started

### Requirements

- PHP 8.3+
- Composer
- Node.js 18+

### Install

```bash
git clone <repo-url>
cd trup

composer run setup
```

The `setup` script handles everything in one go:

```
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate          # creates DB + seeds translations
npm install
npm run build
```

### Run

```bash
composer run dev
```

This starts four processes concurrently:

| Process | Description |
|---|---|
| `php artisan serve` | Laravel dev server on port 8000 |
| `php artisan queue:listen` | Background job worker |
| `php artisan pail` | Log tail |
| `npm run dev` | Vite asset watcher |

Visit [http://localhost:8000](http://localhost:8000).

A test account is pre-seeded: **test@test.com / password**

---

## Project Structure

```
app/
  Http/Controllers/
    Admin/               # Admin CRUD controllers
      CardAdminController.php
      DashboardController.php
      PackAdminController.php
      TranslationAdminController.php
      UserAdminController.php
    AuthController.php
    CardController.php
    DeckController.php
    GameController.php
    PackController.php
    PageController.php   # Serves the SPA shell
    ShopController.php
    StatsController.php
  Http/Middleware/
    AdminMiddleware.php  # Requires admin role
    SetLocale.php        # Reads locale from session
  Models/
    Card.php
    Deck.php
    Game.php
    Pack.php
    Role.php
    Translation.php      # DB-backed translations
    User.php
  Services/
    GameService.php      # Game logic (play card, attack, end turn)
    RankService.php      # Star/tier calculations
  Translation/
    DatabaseLoader.php   # Replaces Laravel file loader with DB

public/js/
  app.js                 # SPA router + page renderers
  api.js                 # Fetch wrapper for all API calls
  auth.js                # Login, register, session management
  game.js                # Game board, polling, drag-drop
  ui.js                  # UIManager: pages, notifications, cards
  three-cards.js         # Three.js card flip (pack opening)
  three-game.js          # Three.js card animations (in-game)

resources/views/
  app.blade.php          # SPA shell — injects APP_DATA + includes partials
  partials/
    nav.blade.php        # Burger drawer navigation
    pages/               # One file per page (login, game, admin, …)
    overlays/            # Pack opening overlay

database/migrations/     # One migration per schema change
```

---

## Architecture

### Single-Page Application

The app is a single Blade view (`resources/views/app.blade.php`) that renders all pages at load time. Visibility is toggled with `.page.active` via `UIManager.showPage()`. The URL hash (`#home`, `#game`, `#shop`, …) drives routing in `app.js`.

### Data flow

1. `PageController::index()` queries packs, hero classes, rarities, rank tiers, and the current locale
2. All data + UI strings are injected into `window.APP_DATA` as JSON in the `<head>`
3. JS reads `APP_DATA` to populate dynamic sections (shop grid, pack opener, deck builder, admin tables)
4. Static strings in Blade templates use `__('app.key')` which reads from the `translations` DB table

### Translations

All copy lives in the `translations` database table — no language files. The custom `DatabaseLoader` swaps in transparently so `__('app.key')` continues to work everywhere.

Translations are cached per `locale + group` via `Cache::rememberForever()` and the cache is busted automatically when a translation is saved or deleted through the admin panel.

Adding a new language: insert rows for the new locale via the admin **Translations** tab, then add the locale to `SetLocale.php`'s allowed list.

### Rank System

```
Bronze  10–1   (0–29 pts)
Silver  10–1   (30–59 pts)
Gold    10–1   (60–89 pts)
Platinum 10–1  (90–119 pts)
Diamond 10–1   (120–149 pts)
Legend         (150+ pts)
```

Each rank has 2 stars. Winning awards +1 star; a 3-game win streak awards +2. Losing costs 1 star at Gold and above (floor-protected per rank). `RankService` handles all calculations and is called from `GameController` after every game conclusion.

### Roles

Users have roles via a `user_roles` pivot table. Currently: `admin` and `moderator`. The `AdminMiddleware` checks `User::hasRole('admin')`. Roles are manageable in the admin Users tab.

---

## API Overview

All endpoints live under `/api` and require a Sanctum bearer token except auth routes.

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
PUT    /api/auth/profile

GET    /api/cards
GET    /api/cards/mine
GET    /api/packs
POST   /api/packs/{pack}/open
GET    /api/shop
POST   /api/shop/gold
GET    /api/decks
POST   /api/decks
PUT    /api/decks/{deck}
DELETE /api/decks/{deck}
GET    /api/stats

POST   /api/game/queue
GET    /api/game/{game}
POST   /api/game/{game}/play-card
POST   /api/game/{game}/attack
POST   /api/game/{game}/end-turn
POST   /api/game/{game}/surrender

# Admin (requires admin role)
GET    /api/admin/dashboard
GET|POST|PUT|DELETE  /api/admin/cards/{card?}
GET|PUT|DELETE       /api/admin/users/{user?}
GET|POST|PUT|DELETE  /api/admin/packs/{pack?}
GET|POST|PUT|DELETE  /api/admin/translations/{translation?}
GET    /api/admin/translations/locales
```

---

## Environment

Key `.env` values:

```env
APP_NAME="Realm Wars"
APP_LOCALE=en

DB_CONNECTION=sqlite          # default — change to mysql/pgsql as needed

# Optional: real-time with Pusher
PUSHER_APP_ID=
PUSHER_APP_KEY=
PUSHER_APP_SECRET=
PUSHER_APP_CLUSTER=
```
