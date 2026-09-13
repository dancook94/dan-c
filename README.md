# dan-c.co.uk

Public marketing site for a systematic forex day-trading method. Next.js App Router, TypeScript, Tailwind, Bea’s design tokens.

Trust over hype. UK English. No invented live P&L, win rates, or trades — Results stay on placeholders until a paper/live export lands. Historical research belongs on `/backtesting` and must never be marketed as a live track record or as a “20%” CAGR.

## Local run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Route | Purpose |
| --- | --- |
| `/` | Promise, three KPI placeholders, mini equity shell |
| `/results` | Paper/live equity, drawdown, KPIs — placeholders until export |
| `/backtesting` | Historical H4 Donchian research book (not live) |
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

## Backtesting JSON (Trading Ted / fxday)

`/backtesting` reads `data/backtesting/*.json`. Portfolio KPIs in `summary.json` are **locked approved figures**. They are still a historical backtest — not live, not paper, not a 20% CAGR claim.

| File | What it is | Replace when |
| --- | --- | --- |
| `summary.json` | Locked KPIs, disclaimer flags, caveats | Only if the approved summary itself changes |
| `equity.json` | Monthly equity (+ drawdown). Ships as `source: "scaffold-until-fxday-export"` | Drop the real fxday equity series |
| `markets.json` | US30, NAS100, XAUUSD, DE40 — trades, win rate, P&L, % of profits | Per-market export. Gold’s ~49% share is an approved caveat |
| `trades.json` | Full trade list (array may be empty) | Trade-by-trade export. Do not invent fills |
| `years.json` | Calendar-year returns. Only 2022 (−16%) is approved today | Yearly export |

**How to replace a scaffold**

1. From Trading Ted / the fxday research repo, export JSON that matches `src/lib/backtesting-data.ts`.
2. A raw array is accepted for `equity` / `markets` / `trades` / `years`, or the wrapped objects used in this repo (`{ "points": [...] }`, `{ "trades": [...] }`, …).
3. Set `source` to something other than `scaffold-until-fxday-export` (for example `fxday-export`) so the chart caption stops calling the series an illustrative reconstruction.
4. Copy the files over `data/backtesting/` and commit. The UI fills tables when arrays are non-empty; empty `trades` keeps the empty state.
5. Do **not** copy these numbers onto `/results`. Results stays on `data/results.json` and remains placeholders until a paper/live book is published.

Regenerate the illustrative equity scaffold (only if you must) with:

```bash
node scripts/scaffold-backtest-equity.mjs
```

That script is labelled reconstruction. Prefer a real export.

## Hard rules

- Risk disclaimer on every page (footer + extra band near performance claims).
- `/backtesting` always shows the extra caveats: in-sample ~14% to end-2023, gold ~49% of P&L, 2022 ≈ −16%, full-sample 18.7% is **not** 20%.
- Signals stay off the primary nav.
- Never publish illustrative win rates or equity as if they were live.

## Deploy on Vercel

1. Import [github.com/dancook94/dan-c](https://github.com/dancook94/dan-c) in the Vercel dashboard (or `npx vercel link` then `npx vercel`).
2. Framework preset: **Next.js**. Root directory: repository root.
3. Build command: `npm run build`. Output: default `.next`.
4. Preview deployments come from pull requests. Attach `www.dan-c.co.uk` when promoting to production.

If the CLI or Git integration is not linked in this environment, use the dashboard steps above — do not invent a preview URL.
