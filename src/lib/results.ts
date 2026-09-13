import { readFile } from "node:fs/promises";
import path from "node:path";

export type NullableNumber = number | null;

export type ResultsStatus = "coming_soon" | "live";
export type ResultsCurrency = "GBP" | "USD";

export type ResultsKpis = {
  netPnl: NullableNumber;
  winRate: NullableNumber;
  profitFactor: NullableNumber;
  maxDrawdown: NullableNumber;
  avgTrade: NullableNumber;
};

export type EquityPoint = {
  date: string;
  equity: number;
};

export type DrawdownPoint = {
  date: string;
  drawdownPct: number;
};

export type MonthlyReturn = {
  month: string;
  netPnl: number;
  returnPct: number;
  winRate: number;
  trades: number;
  profitFactor: number;
};

export type Trade = {
  id: string;
  openedAt: string;
  closedAt: string;
  symbol: string;
  side: "long" | "short";
  pnl: number;
  rMultiple: number | null;
};

export type ResultsPayload = {
  schemaVersion: 1;
  status: ResultsStatus;
  asOf: string | null;
  currency: ResultsCurrency;
  account: {
    label: string;
    startingEquity: number | null;
  };
  kpis: ResultsKpis;
  equityCurve: EquityPoint[];
  drawdown: DrawdownPoint[];
  monthlyReturns: MonthlyReturn[];
  trades: Trade[];
};

export const emptyResults: ResultsPayload = {
  schemaVersion: 1,
  status: "coming_soon",
  asOf: null,
  currency: "GBP",
  account: {
    label: "Live track record",
    startingEquity: null,
  },
  kpis: {
    netPnl: null,
    winRate: null,
    profitFactor: null,
    maxDrawdown: null,
    avgTrade: null,
  },
  equityCurve: [],
  drawdown: [],
  monthlyReturns: [],
  trades: [],
};

export async function loadResults(): Promise<ResultsPayload> {
  const file = path.join(process.cwd(), "data", "results.json");
  const raw = await readFile(file, "utf8");
  const parsed = JSON.parse(raw) as ResultsPayload;

  return {
    ...emptyResults,
    ...parsed,
    account: { ...emptyResults.account, ...parsed.account },
    kpis: { ...emptyResults.kpis, ...parsed.kpis },
    equityCurve: parsed.equityCurve ?? [],
    drawdown: parsed.drawdown ?? [],
    monthlyReturns: parsed.monthlyReturns ?? [],
    trades: parsed.trades ?? [],
  };
}
