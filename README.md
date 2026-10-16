<h1>Global Super Intelligence News (GSIN)</h1>

A news outlet for artificial intelligence and the road to superintelligence. An **n8n** workflow gathers and summarizes stories; this platform publishes them on the **web** and in an **iOS/Android app**, completely free, with ad slots built in for future revenue.

Forked from the Helio Intelligence Platform: the Express/MongoDB API, auth, n8n ingest, daily brief, comments, moderation, and admin tooling were kept and reshaped; billing, the expert-review roles, journals, and the referral program were removed.

## What readers get

| | No account | Free account |
| --- | --- | --- |
| Every story, analysis, topic pages, search, RSS | ✓ | ✓ |
| The Daily Brief | ✓ | ✓ |
| Read discussions | ✓ | ✓ |
| Post and reply in discussions | | ✓ |
| Save stories, follow topics ("For you") | | ✓ |
| Daily Brief by email (on by default, can be turned off) | | ✓ |

Revenue: ad slots are built into the web and app layouts and are switched off until you configure them. See [docs/ADS.md](docs/ADS.md).

Staff roles: **editor** (curate the feed, moderate) and **admin** (also members).

## Architecture

```mermaid
flowchart LR
    Sources["RSS, arXiv, lab blogs"] --> N8N["n8n: fetch, dedupe, LLM summarize"]
    N8N -->|"POST /api/news, /api/daily-brief"| API["Express API (server/)"]
    API --> Mongo[(MongoDB)]
    Web["React web (client/)"] <--> API
    App["Flutter app (mobile/)"] <--> API
    API -->|"GET /api/subscribers"| N8N
```

```text
gsin/
├── server/    Express + Mongoose API, tests
├── client/    React 18 + Vite web app
├── mobile/    Flutter iOS/Android app
├── samples/   Sample stories and a daily brief (n8n payload shape)
└── docs/N8N_API.md   The n8n contract
```

## Run it locally

Prerequisites: Node 18+, MongoDB (local or Atlas), Flutter 3.27+ for the app.

```bash
# API
cd server
npm install
cp .env.example .env            # set MONGODB_URI, JWT_SECRET, API_KEY
npm run seed                    # loads samples/ as if n8n had posted them
npm run dev                     # http://localhost:4000

# Web (second terminal)
cd client
npm install
npm run dev                     # http://localhost:5173

# Make yourself staff: register on the web, then
cd server && npm run make-admin -- you@example.com admin
```

```bash
# Mobile
cd mobile
flutter pub get
dart run flutter_launcher_icons   # regenerate app icons from assets/icon
flutter analyze && flutter test
flutter run                       # Android emulator: --dart-define=API_BASE_URL=http://10.0.2.2:4000
```

## Connect n8n

Point your workflow's HTTP Request node at `POST {API}/api/news` with header `x-api-key: {API_KEY}`. Payloads from the old Helio workflow are accepted unchanged; RSS-style fields (`link`, `pubDate`, `description`) are also understood. Full contract and a suggested LLM step: [docs/N8N_API.md](docs/N8N_API.md).

## Configuration

API (`server/.env`):

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | Must include a database name, e.g. `…/gsin` |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Sessions |
| `API_KEY` | Shared secret for n8n |
| `CLIENT_URL` | Web origin: CORS, RSS/sitemap links |
| `BRAND_NAME`, `BRAND_TAGLINE` | Used in RSS |

Web: rename or re-color in `client/src/brand.js`; set `API_PROXY_TARGET` on Netlify. Mobile: `mobile/lib/brand.dart` and `mobile/lib/config.dart` (`API_BASE_URL`, `WEB_BASE_URL` via `--dart-define`).

Ads: `VITE_ADS_PROVIDER` and slot IDs on the web, `ADS_PROVIDER` in the app. See [docs/ADS.md](docs/ADS.md).

## Deploy

- **API:** Render blueprint in `render.yaml` (or any Node host).
- **Web:** Netlify (`netlify.toml`); `/api/*`, `/rss.xml`, and `/sitemap.xml` are proxied to the API.
- **Mobile:** see [mobile/RELEASE.md](mobile/RELEASE.md). Bundle ID `co.techcatalyst.gsin`; home-screen label "GSIN".

## Tests

```bash
cd server && npm test                                   # uses mongodb-memory-server
TEST_MONGODB_URI=mongodb://127.0.0.1:27017/x npm test   # or any running MongoDB
cd client && npm run build
cd mobile && flutter analyze && flutter test
```

## Design

Cool "clean room" paper, indigo ink, one electric ultramarine accent, and flare red reserved for breaking news. Bricolage Grotesque for headlines and UI, Newsreader for reading text. The signature element is the **GSIN lockup**: the exponential-curve mark, a heavy condensed "GSIN", and the full name set small beside it. Tokens live at the top of `client/src/styles.css` and in `mobile/lib/theme/app_theme.dart`; both support dark mode.
