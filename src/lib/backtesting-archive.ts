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

export const TSMOM_RULES = [
  {
    title: "Absolute 12–1 filter",
    body: "Per market, compute the 12–1 month return (twelve-month return, skipping the latest month). The name is eligible long only if that score is greater than zero. This is time-series momentum, not a relative dual-momentum rank of the sleeve.",
  },
  {
    title: "Holdings when more than three qualify",
    body: "If more than three markets are eligible, take the top three by 12–1 score. Tie-break order: USA30, USATECH, XAUUSD, DEU40. At most three names are open.",
  },
  {
    title: "Rebalance",
    body: "Monthly rebalance on the first H4 open of the new month. If none qualify, the book sits in cash.",
  },
  {
    title: "Risk and exits",
    body: "1% of equity risked to a hard 2×H4 ATR stop. Flatten on that stop or on month-end demotion only. No Chandelier trail. No Donchian channel exit.",
  },
  {
    title: "Costs",
    body: "Same research costs as the multi-market H4 Donchian and dual-momentum books (Dukascopy history, after costs).",
  },
] as const;

export const TSMOM_MARKET_FILTERS = [
  "All",
  "XAUUSD",
  "NAS100",
  "US30",
  "DE40",
] as const;

export const VOL_TARGET_RULES = [
  {
    title: "Lagged SMA200 filter",
    body: "Long only when the prior UTC daily close is above the prior 200-day SMA (lagged). No short book. If the close is below that lagged average, the name is not eligible.",
  },
  {
    title: "Rebalance",
    body: "Monthly rebalance on the first H4 open of the new month. This is not an H4 Donchian channel system, not a 12–1 rank, and it is not the London day-trading book.",
  },
  {
    title: "Holdings when more than three qualify",
    body: "At most three names are open. If more than three markets are eligible, prefer the lowest current H4 ATR%. Tie-break order: USA30, USATECH, XAUUSD, DEU40.",
  },
  {
    title: "Risk and exits",
    body: "1% of equity risked to a hard 2×H4 ATR stop. Flatten on that stop or on month-end demotion only. No Chandelier trail. No Donchian channel exit. No 12–1 momentum rank.",
  },
  {
    title: "Costs",
    body: "Same research costs as the multi-market H4 Donchian, dual-momentum, and 12–1 TSMOM books (Dukascopy history, after costs).",
  },
] as const;

export const VOL_TARGET_MARKET_FILTERS = [
  "All",
  "XAUUSD",
  "NAS100",
  "US30",
  "DE40",
] as const;
