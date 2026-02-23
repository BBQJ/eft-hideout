# EFT Hideout Tracker (Local-Only)

PC-focused React app for tracking Escape from Tarkov hideout progression, target upgrades, required materials, and inventory shortfalls.

## Stack

- React + Vite + TypeScript
- Zustand state management
- `localStorage` persistence (user state + data cache)
- Runtime data from `https://api.tarkov.dev/graphql`

## MVP Included

- Hideout overview with station/level nodes
- Station level detail panel with:
  - required items
  - prerequisites
  - completed toggle
  - target toggle
- Inventory editor (owned quantities)
- Dashboard with aggregated required and missing materials for targets
- Export/Import JSON backup for local user state
- Runtime data cache + manual `Refresh data`

## Data Model Notes

- Upgrade IDs are stable and derived from station+level:
  - `upgradeId = ${stationId}:${level}`
- User state uses IDs only:
  - `completedUpgradeIds`
  - `targetUpgradeIds`
  - `inventoryByItemId`

## Core Pure Functions

Implemented in `src/lib/planning.ts`:

- `aggregateRequirements(targets)`
- `computeMissing(requirements, inventory)`
- `unlockableUpgrades(completed, prereqs)`

## Project Tree

```text
.
├─ public/
├─ src/
│  ├─ components/
│  │  └─ UpgradeDetailPanel.tsx
│  ├─ data/
│  │  ├─ graphqlClient.ts
│  │  └─ tarkovApi.ts
│  ├─ lib/
│  │  ├─ backup.ts
│  │  ├─ planning.ts
│  │  └─ selectors.ts
│  ├─ pages/
│  │  ├─ BackupPage.tsx
│  │  ├─ DashboardPage.tsx
│  │  ├─ InventoryPage.tsx
│  │  └─ OverviewPage.tsx
│  ├─ store/
│  │  ├─ hideoutDataStore.ts
│  │  └─ userStore.ts
│  ├─ types/
│  │  ├─ domain.ts
│  │  └─ graphql.ts
│  ├─ App.tsx
│  ├─ index.css
│  └─ main.tsx
├─ index.html
├─ package.json
├─ tsconfig.app.json
├─ tsconfig.json
├─ tsconfig.node.json
└─ vite.config.ts
```

## Local Run

```bash
npm install
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`).

## Production Build

```bash
npm run build
npm run preview
```

## Static Hosting Deploy

This app is static and can be deployed to Netlify, Vercel, Cloudflare Pages, GitHub Pages, or any static host.

- Build command: `npm run build`
- Publish directory: `dist`

If your host serves SPA routes directly, configure fallback rewrites to `index.html`.

## GitHub Pages (This Repo)

Repository: `https://github.com/BBQJ/eft-hideout`

One-time setup:

1. Open repo settings: `Settings -> Pages`.
2. In `Build and deployment`, set `Source` to `Deploy from a branch`.
3. Select branch `gh-pages` and folder `/ (root)`.

Deploy command:

```bash
npm run deploy
```

Expected site URL:

- `https://bbqj.github.io/eft-hideout/`

Notes:

- This project uses `HashRouter` for GitHub Pages compatibility (`/#/overview` style routes).
- Vite base path is already configured for this repository (`/eft-hideout/` in production).

## Persistence & Privacy

- No login and no server-side user database.
- User progression/inventory lives only in browser `localStorage`.
- Use Backup Export/Import for manual migration and recovery.
