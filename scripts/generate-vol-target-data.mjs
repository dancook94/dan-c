/**
 * Four-market vol-target SMA200 research JSON from locked after-costs headlines.
 *
 * Equity is kind: research_daily so a real weekday dump can overwrite this
 * file. Until then the line is a labelled interpolation of locked checkpoints
 * (start, implied pre-trough peak so −30.33% can be placed, 13 Mar 2020 trough,
 * end-2023 in-sample, implied end-2025 from 2026 −11%, August 2026).
 *
 * Run: node scripts/generate-vol-target-data.mjs
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT_DIR = path.join(process.cwd(), "public/data/backtesting/vol-target");

const START_EQUITY = 5000;
const END_EQUITY = 70490;
const NET_PNL = END_EQUITY - START_EQUITY;
const MAX_DD_PCT = -30.33;
const HEADLINE_CAGR_PCT = 28.17;
const IS_CAGR_PCT = 21.81;
const IS_EQUITY = 24184;
const WF_OOS_CAGR_PCT = 23.84;
const WF_OOS_DD_PCT = -27.5;
const STRESS_CAGR_PCT = 28.05;
const YEAR_2026_PCT = -11;
const SHARPE = 1.06;
const TRADES = 138;
const WIN_RATE_PCT = 21.0;
const PROFIT_FACTOR = 2.82;
const START = "2016-01-04";
const END = "2026-08-28";
const IN_SAMPLE_TO = "2023-12-29";
const IN_SAMPLE_TO_LABEL = "2023-12-31";
const PEAK_DATE = "2020-02-19";
const TROUGH_DATE = "2020-03-13";
const END_2025 = "2025-12-31";
const GOLD_SHARE_PCT = 62.5;
const DOW_PNL = 50;
const DOW_MONTHS = 92;
const TOTAL_MONTHS = 128;

const END_2025_EQUITY =
  Math.round((END_EQUITY / (1 + YEAR_2026_PCT / 100)) * 100) / 100;
const GOLD_PNL = Math.round((GOLD_SHARE_PCT / 100) * NET_PNL);
const POUNDS_SHARE_2024_26_PCT =
  Math.round(((END_EQUITY - IS_EQUITY) / NET_PNL) * 1000) / 10;

function parseISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function formatISO(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

function isWeekday(ms) {
  const day = new Date(ms).getUTCDay();
  return day !== 0 && day !== 6;
}

function tradingDays(startIso, endIso) {
  const days = [];
  for (let t = parseISO(startIso); t <= parseISO(endIso); t += 86400000) {
    if (isWeekday(t)) days.push(formatISO(t));
  }
  return days;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function logLerp(a, b, t) {
  if (a <= 0 || b <= 0) return lerp(a, b, t);
  return Math.exp(lerp(Math.log(a), Math.log(b), t));
}

function yearsBetween(startIso, endIso) {
  return (parseISO(endIso) - parseISO(startIso)) / (365.25 * 86400000);
}

function impliedPeakEquity() {
  const t0 = parseISO(START);
  const t1 = parseISO(IN_SAMPLE_TO);
  const t = parseISO(PEAK_DATE);
  const u = (t - t0) / (t1 - t0);
  return logLerp(START_EQUITY, IS_EQUITY, u);
}

const PEAK_EQUITY = Math.round(impliedPeakEquity() * 100) / 100;
const TROUGH_EQUITY =
  Math.round(PEAK_EQUITY * (1 + MAX_DD_PCT / 100) * 100) / 100;
const HOLDOUT_CAGR_PCT =
  Math.round(
    ((END_EQUITY / IS_EQUITY) ** (1 / yearsBetween(IN_SAMPLE_TO, END)) - 1) *
      10000,
  ) / 100;

const ANCHORS = [
  [START, START_EQUITY],
  [PEAK_DATE, PEAK_EQUITY],
  [TROUGH_DATE, TROUGH_EQUITY],
  [IN_SAMPLE_TO, IS_EQUITY],
  [END_2025, END_2025_EQUITY],
  [END, END_EQUITY],
];

function buildEquity() {
  const days = tradingDays(START, END);
  const anchors = ANCHORS.map(([date, equity]) => ({
    date,
    t: parseISO(date),
    equity,
  }));

  const raw = days.map((date) => {
    const t = parseISO(date);
    let i = 0;
    while (i < anchors.length - 2 && t > anchors[i + 1].t) i += 1;
    const a = anchors[i];
    const b = anchors[i + 1];
    const span = b.t - a.t || 1;
    const u = Math.min(1, Math.max(0, (t - a.t) / span));
    const flat = a.equity === b.equity;
    const base = flat ? a.equity : logLerp(a.equity, b.equity, u);
    return { date, equity: base };
  });

  for (let i = 0; i < anchors.length - 1; i += 1) {
    const a = anchors[i];
    const b = anchors[i + 1];
    const segment = raw.filter((p) => {
      const t = parseISO(p.date);
      return t >= a.t && t <= b.t;
    });
    if (segment.length < 2) continue;
    for (let j = 0; j < segment.length; j += 1) {
      const u = j / (segment.length - 1);
      const target =
        a.equity === b.equity ? a.equity : logLerp(a.equity, b.equity, u);
      segment[j].equity = Math.round(target * 100) / 100;
    }
    segment[0].equity = a.equity;
    segment[segment.length - 1].equity = b.equity;
  }

  raw[0].equity = START_EQUITY;
  raw[raw.length - 1].equity = END_EQUITY;

  const byDate = new Map(raw.map((p) => [p.date, p]));
  for (const [date, equity] of ANCHORS) {
    if (byDate.has(date)) byDate.get(date).equity = equity;
  }

  let peak = raw[0].equity;
  const points = raw.map((p) => {
    peak = Math.max(peak, p.equity);
    const drawdownPct = peak > 0 ? ((p.equity - peak) / peak) * 100 : 0;
    return {
      date: p.date,
      equity: Math.round(p.equity * 100) / 100,
      drawdownPct: Math.round(drawdownPct * 100) / 100,
    };
  });

  let maxDd = 0;
  let maxDdDate = points[0].date;
  for (const p of points) {
    if (p.drawdownPct < maxDd) {
      maxDd = p.drawdownPct;
      maxDdDate = p.date;
    }
  }

  return { points, maxDd, maxDdDate };
}

const { points, maxDd, maxDdDate } = buildEquity();

const howToReplaceEquity =
  "Overwrite public/data/backtesting/vol-target/equity_curve.json with the research daily dump. Keep schemaVersion: 1 and kind: research_daily. Provide points[].date (YYYY-MM-DD), points[].equity, optional points[].drawdownPct, annotations[] (include type: max_drawdown with the 13 March 2020 trough), and yearlyReturns[]. Always include source.howToReplace so chart captions never render undefined.";

const equityPayload = {
  schemaVersion: 1,
  kind: "research_daily",
  currency: "GBP",
  startingEquity: START_EQUITY,
  endingEquity: END_EQUITY,
  startDate: START,
  endDate: END,
  headlineCagrPct: HEADLINE_CAGR_PCT,
  reconstructedCagrPct: HEADLINE_CAGR_PCT,
  inSampleTo: IN_SAMPLE_TO,
  inSampleCagrPct: IS_CAGR_PCT,
  inSampleEquity: IS_EQUITY,
  maxDrawdownPct: MAX_DD_PCT,
  headlineMaxDrawdownPct: MAX_DD_PCT,
  source: {
    type: "checkpoint_interpolated",
    label:
      "Labelled interpolation of locked checkpoints — not a Dukascopy weekday export. Hits start £5,000, an implied Feb 2020 peak so the locked −30.33% trough on 13 March 2020 can be placed, in-sample £24,184 at end-2023, implied end-2025 from the locked 2026 −11%, and £70,490 on 28 August 2026. 2017’s +115–120% outlier is not a year-end print on this line.",
    inputs: [
      "Start £5,000 on 4 Jan 2016 (locked)",
      `Implied peak £${PEAK_EQUITY.toLocaleString("en-GB")} on 19 Feb 2020 so the locked −30.33% trough can be placed (peak date and pounds are not a research print)`,
      `Trough £${TROUGH_EQUITY.toLocaleString("en-GB")} on 13 March 2020, −30.33% (locked date and depth)`,
      "In-sample £24,184 at end-2023, +21.81% CAGR (locked)",
      `Implied end-2025 £${END_2025_EQUITY.toLocaleString("en-GB")} from locked 2026 −11%`,
      "End £70,490 on 28 Aug 2026 (locked)",
      "Headline CAGR +28.17%",
      "2017 +115–120% outlier is not drawn as a year-end spike",
    ],
    howToReplace: howToReplaceEquity,
  },
  annotations: [
    {
      date: TROUGH_DATE,
      type: "max_drawdown",
      label: "Max DD −30.33%",
      value: MAX_DD_PCT,
    },
    {
      date: IN_SAMPLE_TO,
      type: "in_sample_end",
      label: "In-sample end (£24,184, +21.81% CAGR)",
      value: IS_CAGR_PCT,
    },
  ],
  yearlyReturns: [],
  points,
};

const yearsPayload = {
  schemaVersion: 1,
  kind: "locked_partial_only",
  currency: "GBP",
  note: "Only 2026 is a locked calendar print (−11% YTD to 28 August). 2017 was a +115–120% outlier (range, not a year-end print). 2024–25 were fat. Other year-ends wait for the daily dump.",
  howToReplace:
    "Overwrite public/data/backtesting/vol-target/years.json with locked year-end rows. Keep schemaVersion: 1 and years[] with year, startEquity, endEquity, netPnl, returnPct. Optional: partial, asOf. Set kind to locked_year_end.",
  years: [
    {
      year: 2026,
      startEquity: END_2025_EQUITY,
      endEquity: END_EQUITY,
      netPnl: Math.round((END_EQUITY - END_2025_EQUITY) * 100) / 100,
      returnPct: YEAR_2026_PCT,
      partial: true,
      asOf: END,
    },
  ],
};

const summaryPayload = {
  schemaVersion: 1,
  slug: "vol-target",
  href: "/backtesting/vol-target",
  title: "Four-market vol-target SMA200 trend filter",
  kind: "locked_research_summary",
  currency: "GBP",
  startingEquity: START_EQUITY,
  endingEquity: END_EQUITY,
  netPnl: NET_PNL,
  closedPnl: NET_PNL,
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
      "+50% spread stress: CAGR +28.05% versus full-sample +28.17%",
    cashMonths: 0,
    totalMonths: TOTAL_MONTHS,
    cashMonthsNote:
      "Cash-month count is not locked. Dow was selected in about 92 of 128 months.",
    poundsShare2024To2026Pct: POUNDS_SHARE_2024_26_PCT,
    maxOpenPositions: 3,
  },
  costsNote:
    "Same research costs as the multi-market H4 Donchian, dual-momentum, and 12–1 TSMOM books.",
  note: "Locked after-costs headline statistics. Equity is a research_daily interpolation of locked checkpoints until a weekday dump lands. Trade table remains SAMPLE until the 138-row book is exported. In-sample equity £24,184 is a locked print. Holdout CAGR in validation.oosResetCagrPct is implied from that print and end equity, not a separate research headline.",
  howToReplace:
    "Overwrite public/data/backtesting/vol-target/summary.json with the locked research summary. Keep schemaVersion: 1 and the numeric fields used by the page (endingEquity, cagrPct, maxDrawdownPct, sharpe, trades, winRatePct, profitFactor, validation).",
};

const marketRows = [
  {
    id: "XAUUSD",
    label: "Gold",
    broker: "XAUUSD",
    pnl: GOLD_PNL,
    sharePct: GOLD_SHARE_PCT,
    note: "About 62.5% of closed P&L — the four-market story is not a balanced sleeve.",
  },
  {
    id: "US30",
    label: "US 30",
    broker: "US30 / USA30",
    pnl: DOW_PNL,
    sharePct: Math.round((DOW_PNL / NET_PNL) * 10000) / 100,
    monthsSelected: DOW_MONTHS,
    note: "Selected often (about 92 of 128 months) and paid about £50. Tie-break first when H4 ATR% ties.",
  },
  {
    id: "NAS100",
    label: "US Tech 100",
    broker: "NAS100 / USATECH",
    pnl: null,
    sharePct: null,
    note: "In the four-name universe. Closed P&L is not broken out in this locked summary. Tie-break second.",
  },
  {
    id: "DE40",
    label: "Germany 40",
    broker: "DE40 / DEU40",
    pnl: null,
    sharePct: null,
    note: "In the four-name universe. Closed P&L is not broken out in this locked summary. Tie-break last.",
  },
];

const marketsPayload = {
  schemaVersion: 1,
  slug: "vol-target",
  currency: "GBP",
  netPnl: NET_PNL,
  note: "Gold is about 62.5% of closed P&L; Dow paid about £50 despite being selected in about 92 of 128 months. Nasdaq and DAX complete the sleeve — their closed P&L is not locked here. Months selected can overlap because the book holds up to three eligible names.",
  howToReplace:
    "Overwrite public/data/backtesting/vol-target/markets.json. Keep schemaVersion: 1 and markets[] with id, label, broker, pnl, sharePct, note. Optional: trades, monthsSelected. pnl/sharePct may be null until a name is broken out.",
  markets: marketRows,
};

function sampleTrades() {
  const rows = [
    [
      "SAMPLE-VT-0001",
      "XAUUSD",
      "2017-01-02",
      "2017-03-31",
      412.8,
      3.86,
      "Held while still above lagged SMA200; month demotion",
    ],
    [
      "SAMPLE-VT-0002",
      "NAS100",
      "2017-01-02",
      "2017-01-18",
      -49.6,
      -1.02,
      "Hard stop (2×H4 ATR)",
    ],
    [
      "SAMPLE-VT-0003",
      "US30",
      "2017-02-01",
      "2017-02-28",
      18.4,
      0.22,
      "Month demotion · lowest H4 ATR% sleeve",
    ],
    [
      "SAMPLE-VT-0004",
      "DE40",
      "2017-04-03",
      "2017-04-12",
      -51.1,
      -1.04,
      "Hard stop (2×H4 ATR)",
    ],
    [
      "SAMPLE-VT-0005",
      "XAUUSD",
      "2017-05-01",
      "2017-12-29",
      1284.6,
      8.71,
      "Held while still above lagged SMA200; month demotion",
    ],
    [
      "SAMPLE-VT-0006",
      "US30",
      "2018-01-02",
      "2018-01-16",
      -53.8,
      -1.05,
      "Hard stop (2×H4 ATR)",
    ],
    [
      "SAMPLE-VT-0007",
      "NAS100",
      "2018-10-01",
      "2018-10-11",
      -56.4,
      -1.08,
      "Hard stop (2×H4 ATR)",
    ],
    [
      "SAMPLE-VT-0008",
      "XAUUSD",
      "2019-07-01",
      "2019-10-31",
      694.2,
      4.93,
      "Held while still above lagged SMA200; month demotion",
    ],
    [
      "SAMPLE-VT-0009",
      "US30",
      "2020-01-02",
      "2020-01-31",
      22.1,
      0.19,
      "Month demotion",
    ],
    [
      "SAMPLE-VT-0010",
      "NAS100",
      "2020-02-03",
      "2020-02-27",
      -64.8,
      -1.11,
      "Hard stop (2×H4 ATR)",
    ],
    [
      "SAMPLE-VT-0011",
      "DE40",
      "2020-02-03",
      "2020-03-12",
      -71.5,
      -1.14,
      "Hard stop (2×H4 ATR) · March 2020 trough",
    ],
    [
      "SAMPLE-VT-0012",
      "XAUUSD",
      "2020-05-01",
      "2020-08-31",
      902.4,
      6.18,
      "Held while still above lagged SMA200; month demotion",
    ],
    [
      "SAMPLE-VT-0013",
      "US30",
      "2021-03-01",
      "2021-03-12",
      -58.6,
      -1.03,
      "Hard stop (2×H4 ATR)",
    ],
    [
      "SAMPLE-VT-0014",
      "NAS100",
      "2021-08-02",
      "2021-08-16",
      -62.9,
      -1.06,
      "Hard stop (2×H4 ATR)",
    ],
    [
      "SAMPLE-VT-0015",
      "DE40",
      "2022-01-03",
      "2022-01-18",
      -68.4,
      -1.09,
      "Hard stop (2×H4 ATR)",
    ],
    [
      "SAMPLE-VT-0016",
      "XAUUSD",
      "2023-04-03",
      "2023-04-19",
      -61.2,
      -0.99,
      "Hard stop (2×H4 ATR)",
    ],
    [
      "SAMPLE-VT-0017",
      "US30",
      "2023-09-01",
      "2023-09-29",
      9.7,
      0.08,
      "Month demotion · often selected, little paid",
    ],
    [
      "SAMPLE-VT-0018",
      "NAS100",
      "2024-01-02",
      "2024-01-17",
      -74.3,
      -1.02,
      "Hard stop (2×H4 ATR)",
    ],
    [
      "SAMPLE-VT-0019",
      "XAUUSD",
      "2024-03-01",
      "2024-11-29",
      3840.5,
      11.62,
      "Held while still above lagged SMA200; month demotion",
    ],
    [
      "SAMPLE-VT-0020",
      "US30",
      "2024-09-02",
      "2024-09-30",
      14.8,
      0.12,
      "Month demotion",
    ],
    [
      "SAMPLE-VT-0021",
      "DE40",
      "2025-01-02",
      "2025-01-14",
      -82.6,
      -1.07,
      "Hard stop (2×H4 ATR)",
    ],
    [
      "SAMPLE-VT-0022",
      "XAUUSD",
      "2025-02-03",
      "2025-12-31",
      2964.1,
      9.44,
      "Held while still above lagged SMA200; month demotion",
    ],
    [
      "SAMPLE-VT-0023",
      "NAS100",
      "2026-02-02",
      "2026-02-13",
      -91.8,
      -1.08,
      "Hard stop (2×H4 ATR)",
    ],
    [
      "SAMPLE-VT-0024",
      "US30",
      "2026-05-01",
      "2026-05-29",
      -44.2,
      -0.86,
      "Month demotion · 2026 giveback",
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
  note: "SAMPLE rows only — not the 138-trade research book. Every id is prefixed SAMPLE-VT and each row sets sample: true. The table UI paginates and filters whatever is in trades[]. Rows are shaped to show the real book’s character: long-only, most names stop out for about 1R, gold carries the result, Dow is selected often for little P&L.",
  howToReplace:
    "Drop a full export at public/data/backtesting/vol-target/trades.json. Keep schemaVersion: 1. Set sample: false. Provide trades[] with required fields id, market, openedAt, closedAt, side, pnl. Optional: symbol, entry, exit, rMultiple, notes. The page will render the full list with the same market filter and pagination.",
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
      slug: "vol-target",
      endingEquity: END_EQUITY,
      netPnl: NET_PNL,
      inSampleEquity: IS_EQUITY,
      peakEquity: PEAK_EQUITY,
      troughEquity: TROUGH_EQUITY,
      end2025Equity: END_2025_EQUITY,
      interpolatedMaxDd: maxDd,
      interpolatedMaxDdDate: maxDdDate,
      impliedHoldoutCagrPct: HOLDOUT_CAGR_PCT,
      poundsShare2024To2026Pct: POUNDS_SHARE_2024_26_PCT,
      goldPnl: GOLD_PNL,
      points: equityPayload.points.length,
      sampleTrades: tradesPayload.trades.length,
    },
    null,
    2,
  ),
);
