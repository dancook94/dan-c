/**
 * Reconstructs a plausible daily equity path from published headline
 * statistics, plus a clearly labelled SAMPLE trade list.
 *
 * Run: node scripts/generate-backtesting-data.mjs
 *
 * Replace the JSON under public/data/backtesting/ with a research export
 * when the full Dukascopy / engine dump is available.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT_DIR = path.join(process.cwd(), "public/data/backtesting");

const START_EQUITY = 5000;
const END_EQUITY = 31097;
const MAX_DD_PCT = -21.3;
const START = "2016-01-04";
const END = "2026-08-28";

/** Anchor dates force the path through known narrative points. */
const ANCHORS = [
  [START, START_EQUITY],
  ["2016-12-30", 5820],
  ["2017-12-29", 6920],
  ["2018-09-28", 8100],
  ["2018-12-24", 7200],
  ["2018-12-31", 7540],
  ["2019-12-31", 9120],
  ["2020-02-19", 9800],
  ["2020-03-23", 8350],
  ["2020-12-31", 11310],
  ["2021-12-31", 13596],
  ["2022-06-17", 10700],
  ["2022-12-30", 11421],
  ["2023-12-29", 14276],
  ["2024-04-30", 17640],
  ["2024-08-15", 20110],
  ["2024-12-31", 24120],
  ["2025-05-30", 26880],
  ["2025-12-31", 29940],
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

  const rand = mulberry32(20160828);
  const raw = days.map((date) => {
    const t = parseISO(date);
    let i = 0;
    while (i < anchors.length - 2 && t > anchors[i + 1].t) i += 1;
    const a = anchors[i];
    const b = anchors[i + 1];
    const span = b.t - a.t || 1;
    const u = Math.min(1, Math.max(0, (t - a.t) / span));
    const base = logLerp(a.equity, b.equity, u);
    const noise = (rand() - 0.5) * 0.0042 * base;
    return { date, equity: Math.max(3800, base + noise) };
  });

  // Re-pin exact anchors so headline dates are exact.
  const byDate = new Map(raw.map((p) => [p.date, p]));
  for (const [date, equity] of ANCHORS) {
    if (byDate.has(date)) byDate.get(date).equity = equity;
  }

  // Segment-wise rescale between anchors so the path still hits them.
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
    for (let j = 0; j < segment.length; j += 1) {
      const u = j / (segment.length - 1);
      const current = lerp(start, end, u);
      const target = logLerp(a.equity, b.equity, u);
      const wiggle = segment[j].equity - current;
      segment[j].equity = Math.round((target + wiggle * 0.35) * 100) / 100;
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
    ["SAMPLE-0001", "US30", "2016-03-08", "2016-03-15", 86.4, 0.92],
    ["SAMPLE-0002", "XAUUSD", "2016-06-27", "2016-07-11", 142.1, 1.41],
    ["SAMPLE-0003", "DE40", "2016-11-09", "2016-11-16", -51.8, -1.04],
    ["SAMPLE-0004", "NAS100", "2017-02-14", "2017-02-24", 73.2, 0.88],
    ["SAMPLE-0005", "XAUUSD", "2017-08-08", "2017-08-22", 168.5, 1.62],
    ["SAMPLE-0006", "US30", "2017-10-03", "2017-10-12", -48.6, -0.97],
    ["SAMPLE-0007", "DE40", "2018-01-16", "2018-01-26", 95.0, 1.08],
    ["SAMPLE-0008", "US30", "2018-10-11", "2018-10-18", -62.4, -1.12],
    ["SAMPLE-0009", "XAUUSD", "2018-12-27", "2019-01-10", 121.7, 1.28],
    ["SAMPLE-0010", "NAS100", "2019-03-12", "2019-03-21", 64.3, 0.81],
    ["SAMPLE-0011", "US30", "2019-06-04", "2019-06-18", 110.2, 1.19],
    ["SAMPLE-0012", "DE40", "2019-09-03", "2019-09-12", -44.1, -0.88],
    ["SAMPLE-0013", "XAUUSD", "2019-12-04", "2019-12-16", 155.8, 1.47],
    ["SAMPLE-0014", "NAS100", "2020-03-26", "2020-04-09", 188.4, 1.74],
    ["SAMPLE-0015", "US30", "2020-04-07", "2020-04-21", 134.6, 1.33],
    ["SAMPLE-0016", "XAUUSD", "2020-07-27", "2020-08-07", 176.0, 1.58],
    ["SAMPLE-0017", "DE40", "2021-02-02", "2021-02-12", 82.5, 0.94],
    ["SAMPLE-0018", "US30", "2021-06-15", "2021-06-25", -55.2, -1.01],
    ["SAMPLE-0019", "XAUUSD", "2021-11-16", "2021-11-26", 98.7, 1.05],
    ["SAMPLE-0020", "NAS100", "2022-01-25", "2022-02-03", -71.3, -1.18],
    ["SAMPLE-0021", "US30", "2022-06-20", "2022-06-29", -68.9, -1.15],
    ["SAMPLE-0022", "DE40", "2022-09-29", "2022-10-11", -59.4, -1.07],
    ["SAMPLE-0023", "XAUUSD", "2023-03-13", "2023-03-24", 147.2, 1.39],
    ["SAMPLE-0024", "US30", "2023-07-11", "2023-07-21", 91.6, 1.02],
    ["SAMPLE-0025", "NAS100", "2023-11-02", "2023-11-14", 118.0, 1.21],
    ["SAMPLE-0026", "XAUUSD", "2024-03-05", "2024-03-21", 246.8, 1.96],
    ["SAMPLE-0027", "XAUUSD", "2024-07-16", "2024-08-02", 274.3, 2.11],
    ["SAMPLE-0028", "US30", "2024-09-10", "2024-09-20", 132.4, 1.29],
    ["SAMPLE-0029", "DE40", "2024-11-06", "2024-11-18", 104.7, 1.14],
    ["SAMPLE-0030", "NAS100", "2025-01-21", "2025-01-31", 121.5, 1.22],
    ["SAMPLE-0031", "XAUUSD", "2025-04-08", "2025-04-24", 261.9, 2.04],
    ["SAMPLE-0032", "US30", "2025-08-12", "2025-08-22", 97.3, 1.06],
    ["SAMPLE-0033", "DE40", "2026-02-03", "2026-02-13", 88.1, 0.97],
    ["SAMPLE-0034", "XAUUSD", "2026-05-12", "2026-05-26", 159.4, 1.44],
  ];

  return rows.map(([id, market, opened, closed, pnl, rMultiple]) => ({
    id,
    sample: true,
    market,
    symbol: market,
    side: "long",
    openedAt: `${opened}T08:00:00.000Z`,
    closedAt: `${closed}T16:00:00.000Z`,
    pnl,
    rMultiple,
  }));
}

const { points, maxDd, maxDdDate } = buildEquity();
const years = yearlyReturns(points);
const end2023 = yearEnd(points, 2023);
const isCagr =
  end2023 != null
    ? (end2023.equity / START_EQUITY) ** (1 / 8) - 1
    : null;
const yearsSpan =
  (parseISO(END) - parseISO(START)) / (365.25 * 86400000);
const cagr = (END_EQUITY / START_EQUITY) ** (1 / yearsSpan) - 1;

const equityPayload = {
  schemaVersion: 1,
  kind: "illustrative_reconstructed",
  currency: "GBP",
  startingEquity: START_EQUITY,
  endingEquity: END_EQUITY,
  startDate: START,
  endDate: END,
  headlineCagrPct: 18.7,
  reconstructedCagrPct: Math.round(cagr * 10000) / 100,
  inSampleTo: "2023-12-29",
  inSampleCagrPct:
    isCagr == null ? null : Math.round(isCagr * 10000) / 100,
  maxDrawdownPct: Math.round(maxDd * 100) / 100,
  headlineMaxDrawdownPct: MAX_DD_PCT,
  source: {
    type: "illustrative_reconstructed",
    label:
      "Illustrative daily path reconstructed from published headline statistics. Not a raw Dukascopy tick-by-tick export.",
    inputs: [
      "Start £5,000 on 4 Jan 2016",
      "End £31,097 on 28 Aug 2026",
      "Headline CAGR +18.70% over ~2016–2026",
      "In-sample to end-2023 ~+14% CAGR",
      "Calendar 2022 about −16%",
      "Max drawdown −21.3%",
      "Most of the remaining profit placed in 2024–25",
    ],
    howToReplace:
      "Overwrite public/data/backtesting/equity_curve.json with a research export that keeps schemaVersion, points[].date (YYYY-MM-DD), points[].equity, and optional points[].drawdownPct plus annotations[].",
  },
  annotations: [
    {
      date: maxDdDate,
      type: "max_drawdown",
      label: `Max drawdown ${MAX_DD_PCT.toFixed(1)}%`,
      value: MAX_DD_PCT,
    },
    {
      date: "2022-12-30",
      type: "calendar_year",
      label: "2022 calendar year −16%",
      value: -16,
    },
    {
      date: "2023-12-29",
      type: "in_sample_end",
      label: "In-sample end (~+14% CAGR)",
      value: 14,
    },
  ],
  yearlyReturns: years,
  points,
};

const tradesPayload = {
  schemaVersion: 1,
  sample: true,
  kind: "sample",
  currency: "GBP",
  fullTradeCount: 1122,
  markets: ["XAUUSD", "US30", "DE40", "NAS100"],
  note: "SAMPLE rows only — not the 1,122-trade research book. Every id is prefixed SAMPLE and each row sets sample: true. The table UI paginates and filters whatever is in trades[].",
  howToReplace:
    "Drop a full export at public/data/backtesting/trades.json. Keep schemaVersion: 1. Set sample: false. Provide trades[] with required fields id, market, openedAt, closedAt, side, pnl. Optional: symbol, entry, exit, rMultiple, notes. The page will render the full list with the same market filter and pagination.",
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

const end2023Eq = end2023?.equity;
console.log(
  JSON.stringify(
    {
      days: points.length,
      start: points[0],
      end: points[points.length - 1],
      maxDd,
      maxDdDate,
      end2023: end2023Eq,
      isCagrPct: isCagr == null ? null : +(isCagr * 100).toFixed(2),
      cagrPct: +(cagr * 100).toFixed(2),
      sampleTrades: tradesPayload.trades.length,
    },
    null,
    2,
  ),
);
