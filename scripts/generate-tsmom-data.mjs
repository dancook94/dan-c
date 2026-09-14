/**
 * Four-market 12–1 TSMOM research JSON from locked after-costs headlines.
 *
 * Equity is a research_daily scaffold (start / implied in-sample / end
 * checkpoints only) so a real weekday dump can overwrite this file.
 * Headline max DD (−49.3%) is intra-year and is NOT placed on the line
 * until the daily export includes a max_drawdown annotation date.
 *
 * Run: node scripts/generate-tsmom-data.mjs
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT_DIR = path.join(process.cwd(), "public/data/backtesting/tsmom");

const START_EQUITY = 5000;
const END_EQUITY = 59771;
const NET_PNL = END_EQUITY - START_EQUITY;
const MAX_DD_PCT = -49.3;
const HEADLINE_CAGR_PCT = 26.2;
const IS_CAGR_PCT = 12.92;
const HOLDOUT_CAGR_PCT = 70.1;
const WF_OOS_CAGR_PCT = 17.4;
const WF_OOS_DD_PCT = -50.3;
const STRESS_CAGR_PCT = 26.13;
const SHARPE = 0.82;
const TRADES = 90;
const WIN_RATE_PCT = 22.2;
const PROFIT_FACTOR = 6.82;
const START = "2016-01-04";
const END = "2026-08-28";
const IN_SAMPLE_TO = "2023-12-29";
const IN_SAMPLE_TO_LABEL = "2023-12-31";

/** Implied by locked +12.92% CAGR over eight years — not a locked year-end print. */
const IS_EQUITY = Math.round(START_EQUITY * 1.1292 ** 8 * 100) / 100;
const POUNDS_SHARE_2024_26_PCT = 85;

const MARKET_PNL = {
  XAUUSD: 27127,
  NAS100: 15875,
  US30: 10758,
  DE40: 1005,
};
const MARKET_PNL_SUM =
  MARKET_PNL.XAUUSD + MARKET_PNL.NAS100 + MARKET_PNL.US30 + MARKET_PNL.DE40;

const howToReplaceEquity =
  "Overwrite public/data/backtesting/tsmom/equity_curve.json with the research daily dump. Keep schemaVersion: 1 and kind: research_daily. Provide points[].date (YYYY-MM-DD), points[].equity, optional points[].drawdownPct, annotations[] (include type: max_drawdown with the trough date), and yearlyReturns[].";

const equityPayload = {
  schemaVersion: 1,
  kind: "research_daily",
  currency: "GBP",
  startingEquity: START_EQUITY,
  endingEquity: END_EQUITY,
  startDate: START,
  endDate: END,
  headlineCagrPct: HEADLINE_CAGR_PCT,
  reconstructedCagrPct: null,
  inSampleTo: IN_SAMPLE_TO,
  inSampleCagrPct: IS_CAGR_PCT,
  inSampleEquity: IS_EQUITY,
  maxDrawdownPct: null,
  headlineMaxDrawdownPct: MAX_DD_PCT,
  source: {
    type: "scaffold",
    label:
      "Research-daily scaffold. Locked headlines only — not a Dukascopy weekday export. Three checkpoints (start, implied end-2023, August 2026). Intra-year path and the −49.3% max drawdown are not on this line.",
    inputs: [
      "Start £5,000 on 4 Jan 2016",
      "Implied in-sample equity £13,217.12 at end-2023 from locked +12.92% CAGR (eight years; not a locked year-end print)",
      "End £59,771 on 28 Aug 2026",
      "Headline CAGR +26.20%",
      "Headline max drawdown −49.3% (intra-year; date unknown until the daily dump)",
      "~85% of net pounds in 2024–26",
    ],
    howToReplace: howToReplaceEquity,
  },
  annotations: [
    {
      date: IN_SAMPLE_TO,
      type: "in_sample_end",
      label: "In-sample end (implied £13,217, +12.92% CAGR)",
      value: IS_CAGR_PCT,
    },
  ],
  yearlyReturns: [],
  points: [
    { date: START, equity: START_EQUITY, drawdownPct: 0 },
    { date: IN_SAMPLE_TO, equity: IS_EQUITY, drawdownPct: 0 },
    { date: END, equity: END_EQUITY, drawdownPct: 0 },
  ],
};

const yearsPayload = {
  schemaVersion: 1,
  kind: "pending_daily_dump",
  currency: "GBP",
  note: "Calendar year-end equity is not locked yet. Drop yearlyReturns from the research daily dump here. Until then the page shows only the locked in-sample / 2024–26 splits.",
  howToReplace:
    "Overwrite public/data/backtesting/tsmom/years.json with locked year-end rows. Keep schemaVersion: 1 and years[] with year, startEquity, endEquity, netPnl, returnPct. Optional: partial, asOf. Set kind to locked_year_end.",
  years: [],
};

const summaryPayload = {
  schemaVersion: 1,
  slug: "tsmom",
  href: "/backtesting/tsmom",
  title: "Four-market 12–1 month TSMOM",
  kind: "locked_research_summary",
  currency: "GBP",
  startingEquity: START_EQUITY,
  endingEquity: END_EQUITY,
  netPnl: NET_PNL,
  closedPnl: MARKET_PNL_SUM,
  cagrPct: HEADLINE_CAGR_PCT,
  maxDrawdownPct: MAX_DD_PCT,
  sharpe: SHARPE,
  trades: TRADES,
  winRatePct: WIN_RATE_PCT,
  profitFactor: PROFIT_FACTOR,
  periodLabel: "Jan 2016 – Aug 2026",
  vendor: "Dukascopy",
  startDate: START,
  endDate: END,
  afterCosts: true,
  markets: ["US30", "NAS100", "XAUUSD", "DE40"],
  marketAliases: {
    US30: "USA30",
    NAS100: "USATECH",
    XAUUSD: "XAUUSD",
    DE40: "DEU40",
  },
  validation: {
    inSampleTo: IN_SAMPLE_TO_LABEL,
    inSampleEquity: IS_EQUITY,
    inSampleCagrPct: IS_CAGR_PCT,
    inSampleMaxDrawdownPct: MAX_DD_PCT,
    oosResetPeriod: "2024–26",
    oosResetCagrPct: HOLDOUT_CAGR_PCT,
    walkForwardOosCagrPct: WF_OOS_CAGR_PCT,
    walkForwardOosMaxDrawdownPct: WF_OOS_DD_PCT,
    spreadStressCagrPct: STRESS_CAGR_PCT,
    spreadStress:
      "+50% spread stress: CAGR +26.13% versus full-sample +26.20%",
    cashMonths: 21,
    totalMonths: 128,
    cashMonthsNote: "Including 2016 lookback warmup",
    poundsShare2024To2026Pct: POUNDS_SHARE_2024_26_PCT,
    maxOpenPositions: 3,
  },
  costsNote: "Same research costs as the multi-market H4 Donchian book.",
  note: "Locked after-costs headline statistics. Equity is a research_daily scaffold (three checkpoints) until Trading Ted drops the weekday dump. Trade table remains SAMPLE until the 90-row book is exported. In-sample equity is implied by the locked +12.92% CAGR, not a published year-end print.",
  howToReplace:
    "Overwrite public/data/backtesting/tsmom/summary.json with the locked research summary. Keep schemaVersion: 1 and the numeric fields used by the page (endingEquity, cagrPct, maxDrawdownPct, sharpe, trades, winRatePct, profitFactor, validation).",
};

const marketRows = [
  {
    id: "XAUUSD",
    label: "Gold",
    broker: "XAUUSD",
    pnl: MARKET_PNL.XAUUSD,
    monthsSelected: 66,
    note: "About half of closed P&L — same gold-heavy outcome as the other archive books, different rules.",
  },
  {
    id: "NAS100",
    label: "US Tech 100",
    broker: "NAS100 / USATECH",
    pnl: MARKET_PNL.NAS100,
    monthsSelected: 100,
    note: "Selected in the most months (100). Second-largest sleeve.",
  },
  {
    id: "US30",
    label: "US 30",
    broker: "US30 / USA30",
    pnl: MARKET_PNL.US30,
    monthsSelected: 69,
    note: "Third sleeve. Tie-break first when 12–1 scores are equal.",
  },
  {
    id: "DE40",
    label: "Germany 40",
    broker: "DE40 / DEU40",
    pnl: MARKET_PNL.DE40,
    monthsSelected: 67,
    note: "Smallest contributor. Still selected in 67 months.",
  },
].map((market) => ({
  ...market,
  sharePct: Math.round((market.pnl / MARKET_PNL_SUM) * 10000) / 100,
}));

const marketsPayload = {
  schemaVersion: 1,
  slug: "tsmom",
  currency: "GBP",
  netPnl: MARKET_PNL_SUM,
  note: `Approximate closed P&L by market (sums to £${MARKET_PNL_SUM.toLocaleString("en-GB")}; account equity finished £59,771). Gold is about 49.5% of that sleeve. Months selected can overlap because the book holds up to three eligible names.`,
  howToReplace:
    "Overwrite public/data/backtesting/tsmom/markets.json. Keep schemaVersion: 1 and markets[] with id, label, broker, pnl, sharePct, note. Optional: trades, monthsSelected.",
  markets: marketRows,
};

function sampleTrades() {
  const rows = [
    [
      "SAMPLE-TS-0001",
      "NAS100",
      "2017-02-01",
      "2017-02-15",
      -51.4,
      -1.03,
      "Hard stop (2×H4 ATR)",
    ],
    [
      "SAMPLE-TS-0002",
      "US30",
      "2017-02-01",
      "2017-02-28",
      94.6,
      0.88,
      "Month demotion",
    ],
    [
      "SAMPLE-TS-0003",
      "XAUUSD",
      "2017-03-01",
      "2017-03-14",
      -49.8,
      -1.01,
      "Hard stop (2×H4 ATR)",
    ],
    [
      "SAMPLE-TS-0004",
      "DE40",
      "2018-01-02",
      "2018-01-16",
      -54.2,
      -1.06,
      "Hard stop (2×H4 ATR)",
    ],
    [
      "SAMPLE-TS-0005",
      "NAS100",
      "2018-01-02",
      "2018-01-31",
      -46.1,
      -0.92,
      "Month demotion",
    ],
    [
      "SAMPLE-TS-0006",
      "US30",
      "2019-04-01",
      "2019-04-12",
      -58.7,
      -1.04,
      "Hard stop (2×H4 ATR)",
    ],
    [
      "SAMPLE-TS-0007",
      "XAUUSD",
      "2019-07-01",
      "2019-10-31",
      718.4,
      5.12,
      "Held while still eligible; month demotion",
    ],
    [
      "SAMPLE-TS-0008",
      "DE40",
      "2020-02-03",
      "2020-02-26",
      -62.9,
      -1.09,
      "Hard stop (2×H4 ATR)",
    ],
    [
      "SAMPLE-TS-0009",
      "NAS100",
      "2020-05-01",
      "2020-07-31",
      904.3,
      6.44,
      "Held while still eligible; month demotion",
    ],
    [
      "SAMPLE-TS-0010",
      "US30",
      "2021-01-04",
      "2021-01-19",
      -66.5,
      -1.02,
      "Hard stop (2×H4 ATR)",
    ],
    [
      "SAMPLE-TS-0011",
      "DE40",
      "2021-06-01",
      "2021-06-14",
      -64.8,
      -1.07,
      "Hard stop (2×H4 ATR)",
    ],
    [
      "SAMPLE-TS-0012",
      "NAS100",
      "2021-08-02",
      "2021-08-13",
      -71.2,
      -1.11,
      "Hard stop (2×H4 ATR)",
    ],
    [
      "SAMPLE-TS-0013",
      "XAUUSD",
      "2022-01-03",
      "2022-01-18",
      -73.6,
      -1.05,
      "Hard stop (2×H4 ATR)",
    ],
    [
      "SAMPLE-TS-0014",
      "US30",
      "2022-04-01",
      "2022-04-11",
      -69.4,
      -1.08,
      "Hard stop (2×H4 ATR)",
    ],
    [
      "SAMPLE-TS-0015",
      "NAS100",
      "2023-03-01",
      "2023-03-16",
      -67.9,
      -1.01,
      "Hard stop (2×H4 ATR)",
    ],
    [
      "SAMPLE-TS-0016",
      "DE40",
      "2023-09-01",
      "2023-09-14",
      -70.3,
      -1.04,
      "Hard stop (2×H4 ATR)",
    ],
    [
      "SAMPLE-TS-0017",
      "NAS100",
      "2024-01-02",
      "2024-06-28",
      2840.5,
      9.76,
      "Held while still eligible; month demotion",
    ],
    [
      "SAMPLE-TS-0018",
      "XAUUSD",
      "2024-03-01",
      "2024-11-29",
      4126.8,
      12.41,
      "Held while still eligible; month demotion",
    ],
    [
      "SAMPLE-TS-0019",
      "US30",
      "2024-09-02",
      "2024-09-12",
      -84.7,
      -1.03,
      "Hard stop (2×H4 ATR)",
    ],
    [
      "SAMPLE-TS-0020",
      "DE40",
      "2025-01-02",
      "2025-01-15",
      -88.1,
      -1.06,
      "Hard stop (2×H4 ATR)",
    ],
    [
      "SAMPLE-TS-0021",
      "NAS100",
      "2025-02-03",
      "2025-07-31",
      2614.2,
      8.63,
      "Held while still eligible; month demotion",
    ],
    [
      "SAMPLE-TS-0022",
      "XAUUSD",
      "2025-04-01",
      "2025-12-31",
      3310.6,
      10.28,
      "Held while still eligible; month demotion",
    ],
    [
      "SAMPLE-TS-0023",
      "US30",
      "2026-02-02",
      "2026-02-13",
      -93.5,
      -1.09,
      "Hard stop (2×H4 ATR)",
    ],
    [
      "SAMPLE-TS-0024",
      "NAS100",
      "2026-05-01",
      "2026-07-31",
      1184.9,
      4.51,
      "Held while still eligible; month demotion",
    ],
  ];

  return rows.map(([id, market, opened, closed, pnl, rMultiple, notes]) => ({
    id,
    sample: true,
    market,
    symbol: market,
    side: "long",
    openedAt: `${opened}T08:00:00.000Z`,
    closedAt: `${closed}T16:00:00.000Z`,
    pnl,
    rMultiple,
    notes,
  }));
}

const tradesPayload = {
  schemaVersion: 1,
  sample: true,
  kind: "sample",
  currency: "GBP",
  fullTradeCount: TRADES,
  markets: ["XAUUSD", "NAS100", "US30", "DE40"],
  note: "SAMPLE rows only — not the 90-trade research book. Every id is prefixed SAMPLE-TS and each row sets sample: true. The table UI paginates and filters whatever is in trades[]. Rows are shaped to show the real book’s character: most names stop out for about 1R; a few multi-month holds (especially gold and Nasdaq in 2024–26) carry the result.",
  howToReplace:
    "Drop a full export at public/data/backtesting/tsmom/trades.json. Keep schemaVersion: 1. Set sample: false. Provide trades[] with required fields id, market, openedAt, closedAt, side, pnl. Optional: symbol, entry, exit, rMultiple, notes. The page will render the full list with the same market filter and pagination.",
  trades: sampleTrades(),
};

await mkdir(OUT_DIR, { recursive: true });
await writeFile(
  path.join(OUT_DIR, "equity_curve.json"),
  `${JSON.stringify(equityPayload, null, 2)}\n`,
);
await writeFile(
  path.join(OUT_DIR, "trades.json"),
  `${JSON.stringify(tradesPayload, null, 2)}\n`,
);
await writeFile(
  path.join(OUT_DIR, "years.json"),
  `${JSON.stringify(yearsPayload, null, 2)}\n`,
);
await writeFile(
  path.join(OUT_DIR, "summary.json"),
  `${JSON.stringify(summaryPayload, null, 2)}\n`,
);
await writeFile(
  path.join(OUT_DIR, "markets.json"),
  `${JSON.stringify(marketsPayload, null, 2)}\n`,
);

console.log(
  JSON.stringify(
    {
      slug: "tsmom",
      endingEquity: END_EQUITY,
      netPnl: NET_PNL,
      impliedInSampleEquity: IS_EQUITY,
      marketPnlSum: MARKET_PNL_SUM,
      goldSharePct: marketRows[0].sharePct,
      points: equityPayload.points.length,
      sampleTrades: tradesPayload.trades.length,
    },
    null,
    2,
  ),
);
