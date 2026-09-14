# dan-c.co.uk

Public marketing site for a systematic forex day-trading method. Next.js App Router, TypeScript, Tailwind, Bea’s design tokens.

Trust over hype. UK English. No invented P&L, win rates, or trades — Results stay on placeholders until a live export lands.

## Local run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Route | Purpose |
| --- | --- |
| `/` | Promise, three KPI placeholders, mini equity shell |
| `/results` | Equity, drawdown, KPIs, monthly table, trade log |
| `/backtesting` | Hypothetical H4 Donchian multi-market research deep-dive |
| `/backtesting/dual-momentum` | Hypothetical four-market dual momentum research deep-dive |
| `/method` | Opening-range breakout v1 in plain English |
| `/course` | “Build a trading robot” waitlist |
| `/about` | Who / UK / full risk disclosure |

```bash
npm run build   # must stay green
npm start       # serve the production build
```

Design tokens live in `design/` and are imported from `src/app/globals.css`.

## Results JSON (Python trading repo)

Live figures are **not** hardcoded. The site reads `data/results.json` (also served at `GET /api/results`).

1. Keep `schemaVersion: 1` and the shape in `src/lib/results.ts` / `data/results.schema.json`.
2. From the Python trading repo, export the live book — do not invent sample performance:

   ```bash
   python export_results.py --schema data/results.schema.json --out data/results.json
   ```

3. Set `"status": "live"` and an `asOf` date only when the file contains real fills.
4. Commit or copy that file into this repo (CI job or scheduled export). The UI renders `—` / “Coming soon” for `null` and empty arrays.

Example empty payload (what ships today):

```json
{
  "schemaVersion": 1,
  "status": "coming_soon",
  "asOf": null,
  "currency": "GBP",
  "kpis": {
    "netPnl": null,
    "winRate": null,
    "profitFactor": null,
    "maxDrawdown": null,
    "avgTrade": null
  },
  "equityCurve": [],
  "drawdown": [],
  "monthlyReturns": [],
  "trades": []
}
```

`POST /api/waitlist` is a stub that validates email and returns `{ ok: true }`. Wire it to a list provider later.

## Backtesting JSON

Archive rule: **publish a dedicated Backtesting page for every locked book whose full-sample after-costs CAGR is ≥ 15%.** The index lives at `public/data/backtesting/archive.json` and `src/lib/backtesting-archive.ts`.

`/backtesting` (H4 Donchian) reads static files under `public/data/backtesting/`:

| File | Role |
| --- | --- |
| `archive.json` | Research archive index and the ≥15% CAGR publish rule |
| `equity_curve.json` | Daily reconstructed equity path + yearly returns + annotations |
| `trades.json` | Paginated trade table. Ships as a labelled SAMPLE until a full export lands |

`/backtesting/dual-momentum` reads `public/data/backtesting/dual-momentum/`:

| File | Role |
| --- | --- |
| `summary.json` | Locked after-costs headline KPIs and validation splits |
| `markets.json` | Per-market closed P&L |
| `equity_curve.json` | Illustrative daily path hitting published checkpoints |
| `years.json` | Calendar-year table (kept separate so a dump can replace it without the daily series) |
| `trades.json` | Paginated SAMPLE trade table until a full 67-row export lands |

Headline KPIs (CAGR, max DD, trade count, profit factor, per-market P&L) are the approved research summary. The equity line is an illustrative reconstruction that hits those checkpoints — it is **not** a raw Dukascopy tick export. Sample trades are prefixed `SAMPLE-` / `SAMPLE-DM-` and set `"sample": true`.

To replace later:

1. Overwrite `equity_curve.json` with a research dump that keeps `points[].date` (`YYYY-MM-DD`) and `points[].equity`. Optional: `points[].drawdownPct`, `annotations[]`, `yearlyReturns[]`.
2. Overwrite `trades.json` with the full book. Set `"sample": false`. Required trade fields: `id`, `market`, `openedAt`, `closedAt`, `side`, `pnl`. Optional: `symbol`, `entry`, `exit`, `rMultiple`, `notes`.
3. For dual momentum, also overwrite `summary.json`, `markets.json`, and `years.json` in that folder. Loaders already read by slug under `public/data/backtesting/{slug}/`.
4. Regenerate an illustrative series with `node scripts/generate-backtesting-data.mjs` or `node scripts/generate-dual-momentum-data.mjs` only if you still need a placeholder path.

Never present these pages as live trading.

## Deploy on Vercel

1. Import [github.com/dancook94/dan-c](https://github.com/dancook94/dan-c) in the Vercel dashboard (or `npx vercel link` then `npx vercel`).
2. Framework preset: **Next.js**. Root directory: repository root.
3. Build command: `npm run build`. Output: default `.next`.
4. Preview deployments come from pull requests. Attach `www.dan-c.co.uk` when promoting to production.

If the CLI or Git integration is not linked in this environment, use the dashboard steps above — do not invent a preview URL.

## Hard rules

- Risk disclaimer on every page (footer + extra band near performance claims).
- Signals stay off the primary nav.
- Never publish illustrative win rates or equity as if they were live.
