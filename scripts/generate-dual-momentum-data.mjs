/**
 * Reconstructs a plausible daily equity path from locked dual-momentum
 * headline statistics, plus a clearly labelled SAMPLE trade list.
 *
 * Run: node scripts/generate-dual-momentum-data.mjs
 *
 * Replace the JSON under public/data/backtesting/dual-momentum/ with a
 * research export when the full Dukascopy / engine dump is available.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT_DIR = path.join(
  process.cwd(),
  "public/data/backtesting/dual-momentum",
);

const START_EQUITY = 5000;
const END_EQUITY = 22296;
const MAX_DD_PCT = -52.2;
const HEADLINE_CAGR_PCT = 15.05;
const IS_CAGR_PCT = 7.43;
const START = "2016-01-04";
const END = "2026-08-28";
const IN_SAMPLE_TO = "2023-12-29";
const PEAK_DATE = "2021-11-05";
const PEAK_EQUITY = 11800;
const TROUGH_DATE = "2022-10-14";
const TROUGH_EQUITY =
  Math.round(PEAK_EQUITY * (1 + MAX_DD_PCT / 100) * 100) / 100;
const END_2023_EQUITY =
  Math.round(START_EQUITY * (1 + IS_CAGR_PCT / 100) ** 8 * 100) / 100;

/** Anchor dates force the path through known narrative points. */
const ANCHORS = [
  [START, START_EQUITY],
  ["2016-12-30", START_EQUITY],
  ["2017-12-29", 5620],
  ["2018-09-28", 6180],
  ["2018-12-24", 5890],
  ["2018-12-31", 6040],
  ["2019-12-31", 7280],
  ["2020-02-19", 7860],
  ["2020-03-23", 7040],
  ["2020-04-30", 7040],
  ["2020-12-31", 8680],
  [PEAK_DATE, PEAK_EQUITY],
  ["2021-12-31", 11240],
  ["2022-06-01", 8420],
  ["2022-08-31", 8420],
  [TROUGH_DATE, TROUGH_EQUITY],
  ["2022-12-30", 6280],
  ["2023-03-31", 6280],
  [IN_SAMPLE_TO, END_2023_EQUITY],
  ["2024-06-28", 12180],
  ["2024-12-31", 15460],
  ["2025-06-30", 18120],
  ["2025-12-31", 20540],
  [END, END_EQUITY],
];

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

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildEquity() {
  const days = tradingDays(START, END);
  const anchors = ANCHORS.map(([date, equity]) => ({
    date,
    t: parseISO(date),
    equity,
  }));

  const rand = mulberry32(20160104);
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
    const noise = flat ? 0 : (rand() - 0.5) * 0.0034 * base;
    return { date, equity: Math.max(4200, base + noise) };
  });

  const byDate = new Map(raw.map((p) => [p.date, p]));
  for (const [date, equity] of ANCHORS) {
    if (byDate.has(date)) byDate.get(date).equity = equity;
  }

  for (let i = 0; i < anchors.length - 1; i += 1) {
    const a = anchors[i];
    const b = anchors[i + 1];
    const segment = raw.filter((p) => {
      const t = parseISO(p.date);
      return t >= a.t && t <= b.t;
    });
    if (segment.length < 2) continue;
    const start = segment[0].equity;
    const end = segment[segment.length - 1].equity;
    const flat = a.equity === b.equity;
    for (let j = 0; j < segment.length; j += 1) {
      const u = j / (segment.length - 1);
      const current = lerp(start, end, u);
      const target = flat ? a.equity : logLerp(a.equity, b.equity, u);
      const wiggle = flat ? 0 : segment[j].equity - current;
      segment[j].equity = Math.round((target + wiggle * 0.28) * 100) / 100;
    }
    segment[0].equity = a.equity;
    segment[segment.length - 1].equity = b.equity;
  }

  raw[0].equity = START_EQUITY;
  raw[raw.length - 1].equity = END_EQUITY;

  let peak = raw[0].equity;
  let maxDd = 0;
  let maxDdDate = raw[0].date;
  const points = raw.map((p) => {
    peak = Math.max(peak, p.equity);
    const drawdownPct = peak > 0 ? ((p.equity - peak) / peak) * 100 : 0;
    if (drawdownPct < maxDd) {
      maxDd = drawdownPct;
      maxDdDate = p.date;
    }
    return {
      date: p.date,
      equity: Math.round(p.equity * 100) / 100,
      drawdownPct: Math.round(drawdownPct * 100) / 100,
    };
  });

  return { points, maxDd, maxDdDate };
}

function yearEnd(points, year) {
  const prefix = `${year}-`;
  for (let i = points.length - 1; i >= 0; i -= 1) {
    if (points[i].date.startsWith(prefix)) return points[i];
  }
  return null;
}

function yearlyReturns(points) {
  const years = [];
  let prev = START_EQUITY;
  for (let year = 2016; year <= 2026; year += 1) {
    const end = yearEnd(points, year);
    if (!end) continue;
    const startEq = prev;
    const endEq = end.equity;
    const returnPct = ((endEq - startEq) / startEq) * 100;
    years.push({
      year,
      startEquity: Math.round(startEq * 100) / 100,
      endEquity: endEq,
      netPnl: Math.round((endEq - startEq) * 100) / 100,
      returnPct: Math.round(returnPct * 100) / 100,
      partial: year === 2026,
      asOf: year === 2026 ? END : end.date,
    });
    prev = endEq;
  }
  return years;
}

function sampleTrades() {
  const rows = [
    [
      "SAMPLE-DM-0001",
      "NAS100",
      "2017-02-01",
      "2017-02-14",
      -48.2,
      -1.02,
      "Hard stop (2×H4 ATR)",
    ],
    [
      "SAMPLE-DM-0002",
      "XAUUSD",
      "2017-02-01",
      "2017-02-28",
      126.4,
      1.18,
      "Month demotion",
    ],
    [
      "SAMPLE-DM-0003",
      "US30",
      "2018-01-02",
      "2018-01-16",
      -52.6,
      -1.05,
      "Hard stop (2×H4 ATR)",
    ],
    [
      "SAMPLE-DM-0004",
      "DE40",
      "2018-01-02",
      "2018-01-31",
      -41.8,
      -0.94,
      "Month demotion",
    ],
    [
      "SAMPLE-DM-0005",
      "NAS100",
      "2019-04-01",
      "2019-04-17",
      -55.1,
      -1.01,
      "Hard stop (2×H4 ATR)",
    ],
    [
      "SAMPLE-DM-0006",
      "XAUUSD",
      "2019-07-01",
      "2019-09-30",
      612.8,
      4.86,
      "Held while still top-2; month demotion",
    ],
    [
      "SAMPLE-DM-0007",
      "US30",
      "2020-01-02",
      "2020-01-28",
      -61.4,
      -1.08,
      "Hard stop (2×H4 ATR)",
    ],
    [
      "SAMPLE-DM-0008",
      "DE40",
      "2020-02-03",
      "2020-02-27",
      -58.9,
      -1.11,
      "Hard stop (2×H4 ATR)",
    ],
    [
      "SAMPLE-DM-0009",
      "XAUUSD",
      "2020-05-01",
      "2020-07-31",
      844.2,
      6.21,
      "Held while still top-2; month demotion",
    ],
    [
      "SAMPLE-DM-0010",
      "NAS100",
      "2021-01-04",
      "2021-01-19",
      -64.7,
      -1.03,
      "Hard stop (2×H4 ATR)",
    ],
    [
      "SAMPLE-DM-0011",
      "US30",
      "2021-06-01",
      "2021-06-15",
      -67.2,
      -1.06,
      "Hard stop (2×H4 ATR)",
    ],
    [
      "SAMPLE-DM-0012",
      "NAS100",
      "2021-08-02",
      "2021-11-30",
      1388.5,
      7.94,
      "Held while still top-2; month demotion",
    ],
    [
      "SAMPLE-DM-0013",
      "DE40",
      "2022-01-03",
      "2022-01-18",
      -72.4,
      -1.09,
      "Hard stop (2×H4 ATR)",
    ],
    [
      "SAMPLE-DM-0014",
      "US30",
      "2022-04-01",
      "2022-04-12",
      -69.8,
      -1.12,
      "Hard stop (2×H4 ATR)",
    ],
    [
      "SAMPLE-DM-0015",
      "NAS100",
      "2022-09-01",
      "2022-09-13",
      -74.1,
      -1.14,
      "Hard stop (2×H4 ATR)",
    ],
    [
      "SAMPLE-DM-0016",
      "XAUUSD",
      "2023-04-03",
      "2023-04-20",
      -63.5,
      -0.98,
      "Hard stop (2×H4 ATR)",
    ],
    [
      "SAMPLE-DM-0017",
      "NAS100",
      "2023-11-01",
      "2024-02-29",
      1624.6,
      8.42,
      "Held while still top-2; month demotion",
    ],
    [
      "SAMPLE-DM-0018",
      "XAUUSD",
      "2024-03-01",
      "2024-08-30",
      2418.3,
      11.07,
      "Held while still top-2; month demotion",
    ],
    [
      "SAMPLE-DM-0019",
      "DE40",
      "2024-09-02",
      "2024-09-11",
      -81.6,
      -1.04,
      "Hard stop (2×H4 ATR)",
    ],
    [
      "SAMPLE-DM-0020",
      "US30",
      "2025-01-02",
      "2025-01-16",
      -86.2,
      -1.07,
      "Hard stop (2×H4 ATR)",
    ],
    [
      "SAMPLE-DM-0021",
      "NAS100",
      "2025-02-03",
      "2025-06-30",
      2196.4,
      9.18,
      "Held while still top-2; month demotion",
    ],
    [
      "SAMPLE-DM-0022",
      "XAUUSD",
      "2025-07-01",
      "2025-12-31",
      1872.9,
      7.55,
      "Held while still top-2; month demotion",
    ],
    [
      "SAMPLE-DM-0023",
      "DE40",
      "2026-03-02",
      "2026-03-12",
      -92.4,
      -1.1,
      "Hard stop (2×H4 ATR)",
    ],
    [
      "SAMPLE-DM-0024",
      "NAS100",
      "2026-05-01",
      "2026-07-31",
      968.7,
      4.22,
      "Held while still top-2; month demotion",
    ],
  ];

  return rows.map(
    ([id, market, opened, closed, pnl, rMultiple, notes]) => ({
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
    }),
  );
}

const { points, maxDd, maxDdDate } = buildEquity();
const years = yearlyReturns(points);
const end2023 = yearEnd(points, 2023);
const isCagr =
  end2023 != null
    ? (end2023.equity / START_EQUITY) ** (1 / 8) - 1
    : null;
const yearsSpan = (parseISO(END) - parseISO(START)) / (365.25 * 86400000);
const cagr = (END_EQUITY / START_EQUITY) ** (1 / yearsSpan) - 1;

const sourceLabel =
  "Illustrative daily path reconstructed from published headline statistics. Not a raw Dukascopy tick-by-tick export.";
const howToReplaceEquity =
  "Overwrite public/data/backtesting/dual-momentum/equity_curve.json with a research export that keeps schemaVersion, points[].date (YYYY-MM-DD), points[].equity, and optional points[].drawdownPct plus annotations[].";

const equityPayload = {
  schemaVersion: 1,
  kind: "illustrative_reconstructed",
  currency: "GBP",
  startingEquity: START_EQUITY,
  endingEquity: END_EQUITY,
  startDate: START,
  endDate: END,
  headlineCagrPct: HEADLINE_CAGR_PCT,
  reconstructedCagrPct: Math.round(cagr * 10000) / 100,
  inSampleTo: IN_SAMPLE_TO,
  inSampleCagrPct: isCagr == null ? null : Math.round(isCagr * 10000) / 100,
  maxDrawdownPct: Math.round(maxDd * 100) / 100,
  headlineMaxDrawdownPct: MAX_DD_PCT,
  source: {
    type: "illustrative_reconstructed",
    label: sourceLabel,
    inputs: [
      "Start £5,000 on 4 Jan 2016",
      "End £22,296 on 28 Aug 2026",
      "Headline CAGR +15.05% over ~2016–2026",
      "In-sample to end-2023 ~+7.43% CAGR",
      "Max drawdown −52.2% (in-sample)",
      "Most of the remaining profit placed in 2024–26",
      "2016 lookback warmup held in cash",
    ],
    howToReplace: howToReplaceEquity,
  },
  annotations: [
    {
      date: maxDdDate,
      type: "max_drawdown",
      label: `Max drawdown ${MAX_DD_PCT.toFixed(1)}%`,
      value: MAX_DD_PCT,
    },
    {
      date: IN_SAMPLE_TO,
      type: "in_sample_end",
      label: "In-sample end (~+7.43% CAGR)",
      value: IS_CAGR_PCT,
    },
  ],
  yearlyReturns: years,
  points,
};

const yearsPayload = {
  schemaVersion: 1,
  kind: "illustrative_reconstructed",
  currency: "GBP",
  note: "Derived from the reconstructed equity path so the table matches the chart. 2026 is a partial year to 28 August. Replace this file independently of the daily points if you have calendar-year research totals.",
  howToReplace:
    "Overwrite public/data/backtesting/dual-momentum/years.json. Keep schemaVersion: 1 and years[] with year, startEquity, endEquity, netPnl, returnPct. Optional: partial, asOf.",
  years,
};

const summaryPayload = {
  schemaVersion: 1,
  slug: "dual-momentum",
  href: "/backtesting/dual-momentum",
  title: "Four-market dual momentum",
  kind: "locked_research_summary",
  currency: "GBP",
  startingEquity: START_EQUITY,
  endingEquity: END_EQUITY,
  netPnl: END_EQUITY - START_EQUITY,
  cagrPct: HEADLINE_CAGR_PCT,
  maxDrawdownPct: MAX_DD_PCT,
  sharpe: 0.59,
  trades: 67,
  winRatePct: 16.4,
  profitFactor: 4.15,
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
    inSampleTo: "2023-12-31",
    inSampleCagrPct: IS_CAGR_PCT,
    inSampleMaxDrawdownPct: MAX_DD_PCT,
    oosResetPeriod: "2024–26",
    oosResetCagrPct: 37.9,
    walkForwardOosCagrPct: 14.1,
    walkForwardOosMaxDrawdownPct: -43.8,
    spreadStress:
      "+50% spread stress barely moves (only 67 fills)",
    cashMonths: 21,
    totalMonths: 128,
    cashMonthsNote: "Including 2016 lookback warmup",
  },
  costsNote:
    "Same research costs as the multi-market H4 Donchian book.",
  note: "Locked after-costs headline statistics. Equity and trade files may still be illustrative reconstructions until a full fxday dump lands.",
  howToReplace:
    "Overwrite public/data/backtesting/dual-momentum/summary.json with the locked research summary. Keep schemaVersion: 1 and the numeric fields used by the page (endingEquity, cagrPct, maxDrawdownPct, sharpe, trades, winRatePct, profitFactor, validation).",
};

const marketsPayload = {
  schemaVersion: 1,
  slug: "dual-momentum",
  currency: "GBP",
  netPnl: END_EQUITY - START_EQUITY,
  note: "Approximate closed P&L by market. Shares are of net P&L (£17,296). Winners sum to more than 100% because two markets lost money.",
  howToReplace:
    "Overwrite public/data/backtesting/dual-momentum/markets.json. Keep schemaVersion: 1 and markets[] with id, label, broker, pnl, sharePct, note.",
  markets: [
    {
      id: "XAUUSD",
      label: "Gold",
      broker: "XAUUSD",
      pnl: 9782,
      sharePct: 56.6,
      note: "Largest contributor. Same gold-heavy outcome as the Donchian book, different rules.",
    },
    {
      id: "NAS100",
      label: "US Tech 100",
      broker: "NAS100 / USATECH",
      pnl: 9188,
      sharePct: 53.1,
      note: "Second-largest sleeve — most of the fat right tail sat here.",
    },
    {
      id: "US30",
      label: "US 30",
      broker: "US30 / USA30",
      pnl: -637,
      sharePct: -3.7,
      note: "Net loser over the window.",
    },
    {
      id: "DE40",
      label: "Germany 40",
      broker: "DE40 / DEU40",
      pnl: -1039,
      sharePct: -6.0,
      note: "Net loser over the window.",
    },
  ],
};

const tradesPayload = {
  schemaVersion: 1,
  sample: true,
  kind: "sample",
  currency: "GBP",
  fullTradeCount: 67,
  markets: ["XAUUSD", "NAS100", "US30", "DE40"],
  note: "SAMPLE rows only — not the 67-trade research book. Every id is prefixed SAMPLE-DM and each row sets sample: true. The table UI paginates and filters whatever is in trades[]. Rows are shaped to show the real book’s character: most names stop out for about 1R; a few multi-month holds carry the P&L.",
  howToReplace:
    "Drop a full export at public/data/backtesting/dual-momentum/trades.json. Keep schemaVersion: 1. Set sample: false. Provide trades[] with required fields id, market, openedAt, closedAt, side, pnl. Optional: symbol, entry, exit, rMultiple, notes. The page will render the full list with the same market filter and pagination.",
  trades: sampleTrades(),
};

await mkdir(OUT_DIR, { recursive: true });
await writeFile(
  path.join(OUT_DIR, "equity_curve.json"),
  `${JSON.stringify(equityPayload)}\n`,
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
      days: points.length,
      start: points[0],
      end: points[points.length - 1],
      maxDd,
      maxDdDate,
      troughEquity: TROUGH_EQUITY,
      end2023: end2023?.equity,
      isCagrPct: isCagr == null ? null : +(isCagr * 100).toFixed(2),
      cagrPct: +(cagr * 100).toFixed(2),
      sampleTrades: tradesPayload.trades.length,
    },
    null,
    2,
  ),
);
