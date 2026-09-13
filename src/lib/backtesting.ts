import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  emptyEquity,
  emptyMarkets,
  emptyTrades,
  lockedSummary,
  type BacktestBook,
  type BacktestEquity,
  type BacktestMarkets,
  type BacktestSummary,
  type BacktestTrade,
  type BacktestTrades,
  type BacktestYears,
  type DrawdownPoint,
  type EquityPoint,
  type MarketRow,
  type YearRow,
} from "@/lib/backtesting-data";

export type {
  BacktestBook,
  BacktestCaveat,
  BacktestCurrency,
  BacktestEquity,
  BacktestKpis,
  BacktestMarkets,
  BacktestSummary,
  BacktestTrade,
  BacktestTrades,
  BacktestYears,
  DrawdownPoint,
  EquityPoint,
  MarketRow,
  YearRow,
} from "@/lib/backtesting-data";

export { BACKTEST_MARKETS, lockedSummary } from "@/lib/backtesting-data";

async function readOptionalJson(fileName: string): Promise<unknown | null> {
  try {
    const file = path.join(process.cwd(), "data", "backtesting", fileName);
    const raw = await readFile(file, "utf8");
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function computeDrawdown(points: EquityPoint[]): DrawdownPoint[] {
  let peak = points[0]?.equity ?? 0;
  return points.map((point) => {
    peak = Math.max(peak, point.equity);
    const drawdownPct = peak > 0 ? ((point.equity - peak) / peak) * 100 : 0;
    return {
      date: point.date,
      drawdownPct: Math.round(drawdownPct * 100) / 100,
    };
  });
}

function parseEquity(raw: unknown): BacktestEquity {
  if (!raw) return emptyEquity;
  if (Array.isArray(raw)) {
    const points = raw as EquityPoint[];
    return {
      ...emptyEquity,
      points,
      drawdown: computeDrawdown(points),
    };
  }
  if (!isRecord(raw)) return emptyEquity;
  const points = (Array.isArray(raw.points)
    ? raw.points
    : Array.isArray(raw.equityCurve)
      ? raw.equityCurve
      : []) as EquityPoint[];
  const drawdown = Array.isArray(raw.drawdown)
    ? (raw.drawdown as DrawdownPoint[])
    : computeDrawdown(points);
  return {
    source: typeof raw.source === "string" ? raw.source : emptyEquity.source,
    currency: raw.currency === "USD" ? "USD" : "GBP",
    note: typeof raw.note === "string" ? raw.note : emptyEquity.note,
    points,
    drawdown,
  };
}

function parseMarkets(raw: unknown): BacktestMarkets {
  if (!raw) return emptyMarkets;
  if (Array.isArray(raw)) {
    return { ...emptyMarkets, markets: raw as MarketRow[] };
  }
  if (!isRecord(raw)) return emptyMarkets;
  return {
    source: typeof raw.source === "string" ? raw.source : emptyMarkets.source,
    status: typeof raw.status === "string" ? raw.status : emptyMarkets.status,
    currency: raw.currency === "USD" ? "USD" : "GBP",
    note: typeof raw.note === "string" ? raw.note : emptyMarkets.note,
    markets: Array.isArray(raw.markets)
      ? (raw.markets as MarketRow[])
      : emptyMarkets.markets,
  };
}

function parseTrades(raw: unknown): BacktestTrades {
  if (!raw) return emptyTrades;
  if (Array.isArray(raw)) {
    return { ...emptyTrades, trades: raw as BacktestTrade[] };
  }
  if (!isRecord(raw)) return emptyTrades;
  return {
    source: typeof raw.source === "string" ? raw.source : emptyTrades.source,
    status: typeof raw.status === "string" ? raw.status : emptyTrades.status,
    currency: raw.currency === "USD" ? "USD" : "GBP",
    note: typeof raw.note === "string" ? raw.note : emptyTrades.note,
    trades: Array.isArray(raw.trades) ? (raw.trades as BacktestTrade[]) : [],
  };
}

function parseYears(raw: unknown): BacktestYears | null {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    return {
      source: "scaffold-until-fxday-export",
      status: "pending_export",
      currency: "GBP",
      note: "",
      years: raw as YearRow[],
    };
  }
  if (!isRecord(raw) || !Array.isArray(raw.years)) return null;
  return {
    source:
      typeof raw.source === "string"
        ? raw.source
        : "scaffold-until-fxday-export",
    status: typeof raw.status === "string" ? raw.status : "pending_export",
    currency: raw.currency === "USD" ? "USD" : "GBP",
    note: typeof raw.note === "string" ? raw.note : "",
    years: raw.years as YearRow[],
  };
}

export async function loadBacktest(): Promise<BacktestBook> {
  const [summaryRaw, equityRaw, marketsRaw, tradesRaw, yearsRaw] =
    await Promise.all([
      readOptionalJson("summary.json"),
      readOptionalJson("equity.json"),
      readOptionalJson("markets.json"),
      readOptionalJson("trades.json"),
      readOptionalJson("years.json"),
    ]);

  const parsedSummary = isRecord(summaryRaw)
    ? (summaryRaw as Partial<BacktestSummary>)
    : {};

  return {
    summary: {
      ...lockedSummary,
      ...parsedSummary,
      sample: { ...lockedSummary.sample, ...parsedSummary.sample },
      kpis: { ...lockedSummary.kpis, ...parsedSummary.kpis },
      disclaimer: {
        ...lockedSummary.disclaimer,
        ...parsedSummary.disclaimer,
      },
      caveats:
        parsedSummary.caveats && parsedSummary.caveats.length > 0
          ? parsedSummary.caveats
          : lockedSummary.caveats,
    },
    equity: parseEquity(equityRaw),
    markets: parseMarkets(marketsRaw),
    trades: parseTrades(tradesRaw),
    years: parseYears(yearsRaw),
  };
}
