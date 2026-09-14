import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type {
  ArchivePayload,
  EquityCurvePayload,
  MarketsPayload,
  SummaryPayload,
  TradesPayload,
  YearsPayload,
} from "@/lib/backtesting";

const ROOT = path.join(process.cwd(), "public/data/backtesting");
const DUAL_MOMENTUM_DIR = path.join(
  process.cwd(),
  "public/data/backtesting/dual-momentum",
);

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

export async function loadEquityCurve(
  book?: string,
): Promise<EquityCurvePayload> {
  if (book === "dual-momentum") {
    return readJson<EquityCurvePayload>(
      path.join(DUAL_MOMENTUM_DIR, "equity_curve.json"),
    );
  }
  return readJson<EquityCurvePayload>(path.join(ROOT, "equity_curve.json"));
}

export async function loadBacktestTrades(
  book?: string,
): Promise<TradesPayload> {
  if (book === "dual-momentum") {
    return readJson<TradesPayload>(path.join(DUAL_MOMENTUM_DIR, "trades.json"));
  }
  return readJson<TradesPayload>(path.join(ROOT, "trades.json"));
}

export async function loadBacktestSummary(
  book: string,
): Promise<SummaryPayload> {
  if (book === "dual-momentum") {
    return readJson<SummaryPayload>(
      path.join(DUAL_MOMENTUM_DIR, "summary.json"),
    );
  }
  throw new Error(`No summary.json loader for backtest book: ${book}`);
}

export async function loadBacktestMarkets(
  book: string,
): Promise<MarketsPayload> {
  if (book === "dual-momentum") {
    return readJson<MarketsPayload>(
      path.join(DUAL_MOMENTUM_DIR, "markets.json"),
    );
  }
  throw new Error(`No markets.json loader for backtest book: ${book}`);
}

export async function loadBacktestYears(book: string): Promise<YearsPayload> {
  if (book === "dual-momentum") {
    return readJson<YearsPayload>(path.join(DUAL_MOMENTUM_DIR, "years.json"));
  }
  throw new Error(`No years.json loader for backtest book: ${book}`);
}

export async function loadBacktestArchive(): Promise<ArchivePayload> {
  return readJson<ArchivePayload>(path.join(ROOT, "archive.json"));
}
