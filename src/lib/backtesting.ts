export type BacktestCurrency = "GBP";

export type EquityPoint = {
  date: string;
  equity: number;
  drawdownPct: number;
};

export type EquityAnnotation = {
  date: string;
  type: string;
  label: string;
  value: number;
};

export type YearlyReturn = {
  year: number;
  startEquity: number;
  endEquity: number;
  netPnl: number;
  returnPct: number;
  partial: boolean;
  asOf: string;
};

export type EquityCurvePayload = {
  schemaVersion: 1;
  kind: string;
  currency: BacktestCurrency;
  startingEquity: number;
  endingEquity: number;
  startDate: string;
  endDate: string;
  headlineCagrPct: number;
  reconstructedCagrPct: number;
  inSampleTo: string;
  inSampleCagrPct: number | null;
  maxDrawdownPct: number;
  headlineMaxDrawdownPct: number;
  source: {
    type: string;
    label: string;
    inputs: string[];
    howToReplace: string;
  };
  annotations: EquityAnnotation[];
  yearlyReturns: YearlyReturn[];
  points: EquityPoint[];
};

export type BacktestTrade = {
  id: string;
  sample?: boolean;
  market: string;
  symbol?: string;
  side: "long" | "short";
  openedAt: string;
  closedAt: string;
  pnl: number;
  rMultiple: number | null;
  entry?: number;
  exit?: number;
  notes?: string;
};

export type TradesPayload = {
  schemaVersion: 1;
  sample: boolean;
  kind: string;
  currency: BacktestCurrency;
  fullTradeCount: number;
  markets: string[];
  note: string;
  howToReplace: string;
  trades: BacktestTrade[];
};

export type BacktestMarket = {
  id: string;
  label: string;
  broker: string;
  sharePct: number;
  pnl: number;
  note: string;
};

export type MarketsPayload = {
  schemaVersion: 1;
  slug?: string;
  currency: BacktestCurrency;
  netPnl?: number;
  note: string;
  howToReplace: string;
  markets: BacktestMarket[];
};

export type YearsPayload = {
  schemaVersion: 1;
  kind: string;
  currency: BacktestCurrency;
  note: string;
  howToReplace: string;
  years: YearlyReturn[];
};

export type BacktestValidation = {
  inSampleTo: string;
  inSampleCagrPct: number;
  inSampleMaxDrawdownPct: number;
  oosResetPeriod: string;
  oosResetCagrPct: number;
  walkForwardOosCagrPct: number;
  walkForwardOosMaxDrawdownPct: number;
  spreadStress: string;
  cashMonths: number;
  totalMonths: number;
  cashMonthsNote: string;
};

export type SummaryPayload = {
  schemaVersion: 1;
  slug: string;
  href: string;
  title: string;
  kind: string;
  currency: BacktestCurrency;
  startingEquity: number;
  endingEquity: number;
  netPnl: number;
  cagrPct: number;
  maxDrawdownPct: number;
  sharpe: number;
  trades: number;
  winRatePct: number;
  profitFactor: number;
  periodLabel: string;
  vendor: string;
  startDate: string;
  endDate: string;
  afterCosts: boolean;
  markets: string[];
  marketAliases?: Record<string, string>;
  validation: BacktestValidation;
  costsNote: string;
  note: string;
  howToReplace: string;
};

export type BacktestArchiveBook = {
  slug: string;
  href: string;
  title: string;
  cagrPct: number;
  maxDrawdownPct: number;
  periodLabel?: string;
  dataDir?: string;
};

export type ArchivePayload = {
  schemaVersion: 1;
  rule: string;
  thresholdCagrPct: number;
  note: string;
  howToReplace: string;
  books: BacktestArchiveBook[];
};

export const BACKTEST_SUMMARY = {
  currency: "GBP" as const,
  startingEquity: 5000,
  endingEquity: 31097,
  netPnl: 26097,
  cagrPct: 18.7,
  maxDrawdownPct: -21.3,
  trades: 1122,
  profitFactor: 1.35,
  periodLabel: "Jan 2016 – Aug 2026",
  vendor: "Dukascopy",
  inSampleCagrPct: 14,
  year2022Pct: -16,
};

export const BACKTEST_MARKETS = [
  {
    id: "XAUUSD",
    label: "Gold",
    broker: "XAUUSD",
    sharePct: 49,
    pnl: 12891,
    note: "Dominated the research book — roughly half of net P&L.",
  },
  {
    id: "US30",
    label: "US 30",
    broker: "US30",
    sharePct: 28,
    pnl: 7424,
    note: "Second-largest contributor.",
  },
  {
    id: "DE40",
    label: "Germany 40",
    broker: "DE40",
    sharePct: 12,
    pnl: 3235,
    note: "European index sleeve.",
  },
  {
    id: "NAS100",
    label: "US Tech 100",
    broker: "NAS100 / USATECH",
    sharePct: 10,
    pnl: 2545,
    note: "Smallest sleeve of the four.",
  },
] as const;

export const BACKTEST_RULES = [
  {
    title: "Timeframe and channel",
    body: "H4 Donchian 20/10 — enter on a 20-bar channel break, flatten when price closes back through the 10-bar opposite channel.",
  },
  {
    title: "Regime filter",
    body: "Lagged daily SMA200, long-only. No short book. If the close is below the lagged daily 200-day average, the system stands aside.",
  },
  {
    title: "Risk",
    body: "1% of equity risked to a 2×ATR stop. Position size is a function of that stop, not a fixed lot.",
  },
  {
    title: "Concurrency",
    body: "At most three positions at once across the four markets.",
  },
  {
    title: "Management",
    body: "Chandelier trail after entry. Overnight inventory is allowed — this is a swing system, not the London day-trading book.",
  },
] as const;

export const MARKET_FILTERS = [
  "All",
  "XAUUSD",
  "US30",
  "DE40",
  "NAS100",
] as const;

export type MarketFilter = (typeof MARKET_FILTERS)[number];

export function equityAtDate(
  points: EquityPoint[],
  date: string,
): EquityPoint | undefined {
  return points.find((point) => point.date === date);
}

export function downsampleEquity(
  points: EquityPoint[],
  keepDates: Iterable<string>,
  maxPoints = 720,
): EquityPoint[] {
  if (points.length <= maxPoints) return points;

  const keep = new Set(keepDates);
  const stride = Math.ceil(points.length / maxPoints);
  const picked: EquityPoint[] = [];

  points.forEach((point, index) => {
    const mustKeep =
      index === 0 ||
      index === points.length - 1 ||
      keep.has(point.date) ||
      point.date.endsWith("-01-02") ||
      point.date.endsWith("-01-03") ||
      point.date.endsWith("-01-04");
    if (mustKeep || index % stride === 0) {
      if (picked.at(-1)?.date === point.date) return;
      picked.push(point);
    }
  });

  return picked;
}
