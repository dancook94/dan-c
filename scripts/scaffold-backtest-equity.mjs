/**
 * Builds an illustrative monthly equity path that matches the approved
 * portfolio narrative. Not a live export — replace with fxday output.
 *
 * Locked character:
 *   start £5,000 → end £31,097
 *   full-sample CAGR ~18.7% (2016-01 to 2026-09)
 *   in-sample to end-2023 ~14% CAGR
 *   2022 calendar return ≈ −16%
 *   max drawdown ≈ −21%
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const START = 5000;
const END = 31097;
const MAX_DD_TARGET = -21;

/** Equity at the first of each January (end of prior year), plus Sept 2026 end. */
const ANCHORS = [
  ["2016-01-01", 5000],
  ["2017-01-01", 6000],
  ["2018-01-01", 7320],
  ["2019-01-01", 8052],
  ["2020-01-01", 9984],
  ["2020-02-01", 10800],
  ["2020-04-01", 9500],
  ["2021-01-01", 11782],
  ["2022-01-01", 13431],
  ["2022-07-01", 10610],
  ["2023-01-01", 11282],
  ["2024-01-01", 14263],
  ["2025-01-01", 20681],
  ["2026-01-01", 27920],
  ["2026-09-01", 31097],
];

function monthsBetween(a, b) {
  const [ay, am] = a.split("-").map(Number);
  const [by, bm] = b.split("-").map(Number);
  return (by - ay) * 12 + (bm - am);
}

function addMonths(iso, n) {
  const [y, m] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 + n, 1));
  const yy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${yy}-${mm}-01`;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function wobble(index) {
  return 1 + 0.007 * Math.sin(index * 1.31) + 0.004 * Math.sin(index * 0.47);
}

function interpolateMonthly() {
  const points = [];
  for (let i = 0; i < ANCHORS.length - 1; i += 1) {
    const [startDate, startEq] = ANCHORS[i];
    const [endDate, endEq] = ANCHORS[i + 1];
    const steps = monthsBetween(startDate, endDate);
    for (let s = 0; s < steps; s += 1) {
      const t = s / steps;
      const date = addMonths(startDate, s);
      const raw = lerp(startEq, endEq, t);
      const nudged = s === 0 ? raw : raw * wobble(points.length);
      points.push({ date, equity: Math.round(nudged * 100) / 100 });
    }
  }
  points.push({ date: ANCHORS.at(-1)[0], equity: END });
  points[0].equity = START;
  return points;
}

function withDrawdown(equity) {
  let peak = equity[0].equity;
  let maxDd = 0;
  const drawdown = equity.map((point) => {
    peak = Math.max(peak, point.equity);
    const ddPct = peak > 0 ? ((point.equity - peak) / peak) * 100 : 0;
    maxDd = Math.min(maxDd, ddPct);
    return {
      date: point.date,
      drawdownPct: Math.round(ddPct * 100) / 100,
    };
  });
  return { drawdown, maxDd: Math.round(maxDd * 10) / 10 };
}

function yearsFromJanAnchors() {
  const jan = Object.fromEntries(
    ANCHORS.filter(([d]) => d.endsWith("-01-01")).map(([d, v]) => [
      Number(d.slice(0, 4)),
      v,
    ]),
  );
  jan[2027] = END;
  return jan;
}

const equity = interpolateMonthly();
const { drawdown, maxDd } = withDrawdown(equity);
const first = equity[0].equity;
const last = equity.at(-1).equity;
const years = monthsBetween(equity[0].date, equity.at(-1).date) / 12;
const cagr = (last / first) ** (1 / years) - 1;
const end2023 = equity.find((p) => p.date === "2024-01-01")?.equity;
const inSampleCagr = (end2023 / first) ** (1 / 8) - 1;
const start2022 = equity.find((p) => p.date === "2022-01-01")?.equity;
const end2022 = equity.find((p) => p.date === "2023-01-01")?.equity;
const ret2022 = end2022 / start2022 - 1;

const payload = {
  source: "scaffold-until-fxday-export",
  currency: "GBP",
  note: "Illustrative monthly reconstruction for chart display. Not the fxday trade-by-trade equity series. Locked endpoints: £5,000 start, £31,097 end, max drawdown character about −21%, 2022 calendar return about −16%.",
  points: equity,
  drawdown,
};

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "backtesting", "equity.json");
writeFileSync(out, `${JSON.stringify(payload, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      points: equity.length,
      start: first,
      end: last,
      years: Math.round(years * 100) / 100,
      cagr: `${(cagr * 100).toFixed(1)}%`,
      inSampleCagrTo2023: `${(inSampleCagr * 100).toFixed(1)}%`,
      return2022: `${(ret2022 * 100).toFixed(1)}%`,
      maxDd: `${maxDd}%`,
      maxDdTarget: `${MAX_DD_TARGET}%`,
      janAnchors: yearsFromJanAnchors(),
    },
    null,
    2,
  ),
);
