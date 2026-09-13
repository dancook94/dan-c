export type BacktestCurrency = "GBP" | "USD";

export type BacktestKpis = {
  startingEquity: number;
  endingEquity: number;
  cagrPct: number;
  maxDrawdownPct: number;
  trades: number;
  profitFactor: number;
};

export type BacktestCaveat = {
  id: string;
  text: string;
};

export type BacktestSummary = {
  schemaVersion: 1;
  source: string;
  status: "historical_backtest";
  book: string;
  currency: BacktestCurrency;
  sample: {
    start: string;
    end: string;
    label: string;
  };
  kpis: BacktestKpis;
  disclaimer: {
    historicalOnly: boolean;
    hypothetical: boolean;
    notFinancialAdvice: boolean;
    notLiveTrackRecord: boolean;
    doNotMarketAs20Pct: boolean;
  };
  caveats: BacktestCaveat[];
};

export type EquityPoint = {
  date: string;
  equity: number;
};

export type DrawdownPoint = {
  date: string;
  drawdownPct: number;
};

export type BacktestEquity = {
  source: string;
  currency: BacktestCurrency;
  note: string;
  points: EquityPoint[];
  drawdown: DrawdownPoint[];
};

export type MarketRow = {
  symbol: string;
  label: string;
  trades: number | null;
  winRate: number | null;
  pnl: number | null;
  shareOfProfits: number | null;
  status: "pending_export" | "approved_caveat" | "exported";
  note?: string;
};

export type BacktestMarkets = {
  source: string;
  status: string;
  currency: BacktestCurrency;
  note: string;
  markets: MarketRow[];
};

export type BacktestTrade = {
  id: string;
  openedAt: string;
  closedAt: string;
  market: string;
  side: "long" | "short";
  pnl: number;
  rMultiple: number | null;
};

export type BacktestTrades = {
  source: string;
  status: string;
  currency: BacktestCurrency;
  note: string;
  trades: BacktestTrade[];
};

export type YearRow = {
  year: number;
  returnPct: number | null;
  trades: number | null;
  status: "pending_export" | "approved_caveat" | "exported";
  note?: string;
  partial?: boolean;
};

export type BacktestYears = {
  source: string;
  status: string;
  currency: BacktestCurrency;
  note: string;
  years: YearRow[];
};

export type BacktestBook = {
  summary: BacktestSummary;
  equity: BacktestEquity;
  markets: BacktestMarkets;
  trades: BacktestTrades;
  years: BacktestYears | null;
};

export const BACKTEST_MARKETS = ["US30", "NAS100", "XAUUSD", "DE40"] as const;

export const lockedSummary: BacktestSummary = {
  schemaVersion: 1,
  source: "approved-summary",
  status: "historical_backtest",
  book: "Multi-market H4 Donchian trend",
  currency: "GBP",
  sample: {
    start: "2016-01-01",
    end: "2026-09-01",
    label: "2016–2026",
  },
  kpis: {
    startingEquity: 5000,
    endingEquity: 31097,
    cagrPct: 18.7,
    maxDrawdownPct: -21,
    trades: 1122,
    profitFactor: 1.35,
  },
  disclaimer: {
    historicalOnly: true,
    hypothetical: true,
    notFinancialAdvice: true,
    notLiveTrackRecord: true,
    doNotMarketAs20Pct: true,
  },
  caveats: [
    {
      id: "in-sample-cagr",
      text: "In-sample CAGR was about 14% to the end of 2023.",
    },
    {
      id: "gold-share",
      text: "Gold (XAUUSD) accounted for about 49% of portfolio P&L.",
    },
    {
      id: "year-2022",
      text: "The 2022 calendar return was about −16%.",
    },
    {
      id: "not-20-percent",
      text: "Full-sample CAGR is 18.7%. That is not a clean “20%” claim and must not be marketed as 20%.",
    },
  ],
};

export const emptyMarkets: BacktestMarkets = {
  source: "scaffold-until-fxday-export",
  status: "pending_export",
  currency: "GBP",
  note: "Per-market rows stay empty until the fxday export.",
  markets: [
    {
      symbol: "US30",
      label: "US 30",
      trades: null,
      winRate: null,
      pnl: null,
      shareOfProfits: null,
      status: "pending_export",
    },
    {
      symbol: "NAS100",
      label: "NAS 100",
      trades: null,
      winRate: null,
      pnl: null,
      shareOfProfits: null,
      status: "pending_export",
    },
    {
      symbol: "XAUUSD",
      label: "Gold (XAUUSD)",
      trades: null,
      winRate: null,
      pnl: null,
      shareOfProfits: 0.49,
      status: "approved_caveat",
      note: "Approved caveat: gold contributed about 49% of portfolio P&L.",
    },
    {
      symbol: "DE40",
      label: "Germany 40",
      trades: null,
      winRate: null,
      pnl: null,
      shareOfProfits: null,
      status: "pending_export",
    },
  ],
};

export const emptyTrades: BacktestTrades = {
  source: "scaffold-until-fxday-export",
  status: "pending_export",
  currency: "GBP",
  note: "No individual trades published yet.",
  trades: [],
};

export const emptyEquity: BacktestEquity = {
  source: "scaffold-until-fxday-export",
  currency: "GBP",
  note: "No equity series available.",
  points: [],
  drawdown: [],
};
