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

function bookFile(file: string, book?: string) {
  return book ? path.join(ROOT, book, file) : path.join(ROOT, file);
}

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

export async function loadEquityCurve(
  book?: string,
): Promise<EquityCurvePayload> {
  return readJson<EquityCurvePayload>(bookFile("equity_curve.json", book));
}

export async function loadBacktestTrades(
  book?: string,
): Promise<TradesPayload> {
  return readJson<TradesPayload>(bookFile("trades.json", book));
}

export async function loadBacktestSummary(
  book: string,
): Promise<SummaryPayload> {
  return readJson<SummaryPayload>(bookFile("summary.json", book));
}

export async function loadBacktestMarkets(
  book: string,
): Promise<MarketsPayload> {
  return readJson<MarketsPayload>(bookFile("markets.json", book));
}

export async function loadBacktestYears(book: string): Promise<YearsPayload> {
  return readJson<YearsPayload>(bookFile("years.json", book));
}

export async function loadBacktestArchive(): Promise<ArchivePayload> {
  return readJson<ArchivePayload>(path.join(ROOT, "archive.json"));
}
