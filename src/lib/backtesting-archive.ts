export const BACKTEST_ARCHIVE_RULE =
  "Publish a dedicated Backtesting page for every locked book whose full-sample after-costs CAGR is ≥ 15%.";

export const BACKTEST_ARCHIVE_THRESHOLD_CAGR_PCT = 15;

export const DUAL_MOMENTUM_RULES = [
  {
    title: "Rebalance and rank",
    body: "Monthly rebalance. Rank the four markets by 12-month return. This is not an H4 channel system and it is not the London day-trading book.",
  },
  {
    title: "Absolute filter",
    body: "A market is eligible only if its 12-month return is greater than zero. If none qualify, the book sits in cash.",
  },
  {
    title: "Holdings and risk",
    body: "Hold the top two eligible markets at 1% of equity each, sized to an initial 2×H4 ATR hard stop.",
  },
  {
    title: "Exits",
    body: "Flatten on the hard stop or on month-end demotion only. No Chandelier trail. No Donchian channel exit.",
  },
  {
    title: "Costs",
    body: "Same research costs as the multi-market H4 Donchian book (Dukascopy history, after costs).",
  },
] as const;

export const DUAL_MOMENTUM_MARKET_FILTERS = [
  "All",
  "XAUUSD",
  "NAS100",
  "US30",
  "DE40",
] as const;
