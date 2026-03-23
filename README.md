Old project being bought "to life" since i have had some time on my hands (maternity leave)

# Emberfall ⚔️

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
gh repo clone Rasmus-Emil-H/Realm-wars-TGC-

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

All endpoints live under `/api` and require a Sanctum bearer token except auth routes.

---