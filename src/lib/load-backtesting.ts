import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { EquityCurvePayload, TradesPayload } from "@/lib/backtesting";

const DATA_DIR = path.join(process.cwd(), "public/data/backtesting");

export async function loadEquityCurve(): Promise<EquityCurvePayload> {
  const raw = await readFile(path.join(DATA_DIR, "equity_curve.json"), "utf8");
  return JSON.parse(raw) as EquityCurvePayload;
}

export async function loadBacktestTrades(): Promise<TradesPayload> {
  const raw = await readFile(path.join(DATA_DIR, "trades.json"), "utf8");
  return JSON.parse(raw) as TradesPayload;
}
