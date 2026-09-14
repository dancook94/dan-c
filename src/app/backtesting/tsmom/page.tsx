import type { Metadata } from "next";
import Link from "next/link";
import { BacktestEquityChart } from "@/components/backtest-equity-chart";
import { BacktestTrades } from "@/components/backtest-trades";
import { Container } from "@/components/container";
import { Disclaimer, PerformanceNote } from "@/components/disclaimer";
import { ResearchArchive } from "@/components/research-archive";
import { StatCard } from "@/components/stat-card";
import { TSMOM_MARKET_FILTERS, TSMOM_RULES } from "@/lib/backtesting-archive";
import { downsampleEquity, sourceHowToReplace } from "@/lib/backtesting";
import {
  loadBacktestArchive,
  loadBacktestMarkets,
  loadBacktestSummary,
  loadBacktestTrades,
  loadBacktestYears,
  loadEquityCurve,
} from "@/lib/load-backtesting";
import {
  formatMoney,
  formatMoneyWhole,
  formatNumber,
  formatPercent,
  formatSignedPercent,
} from "@/lib/format";

export const metadata: Metadata = {
  title: "12–1 TSMOM backtest",
  description:
    "Hypothetical four-market 12–1 month time-series momentum research backtest on Dukascopy history, 2016–2026. Full-sample CAGR +26.20% with −49.3% max drawdown. Not live trading results and not financial advice.",
};

const BOOK = "tsmom";

export default async function TsmomBacktestPage() {
  const [equity, trades, summary, markets, years, archive] = await Promise.all([
    loadEquityCurve(BOOK),
    loadBacktestTrades(BOOK),
    loadBacktestSummary(BOOK),
    loadBacktestMarkets(BOOK),
    loadBacktestYears(BOOK),
    loadBacktestArchive(),
  ]);

  const chartPoints = downsampleEquity(
    equity.points,
    equity.annotations.map((item) => item.date),
  );
  const pendingDaily =
    equity.source.type === "scaffold" || equity.points.length < 50;
  const howToReplace = sourceHowToReplace(equity.source);
  const chartCaption = (
    pendingDaily
      ? [
          equity.source.label,
          `Locked headlines are on this page. The line is a ${equity.points.length}-point checkpoint scaffold (start, implied end-2023, August 2026) until the research daily dump lands.`,
          `Headline max drawdown ${formatSignedPercent(summary.maxDrawdownPct, 1)} is intra-year and is not drawn here.`,
          howToReplace,
        ]
      : [
          equity.source.label,
          `Series runs from ${equity.startDate} to ${equity.endDate} (${new Intl.NumberFormat("en-GB").format(equity.points.length)} weekdays; chart downsampled for display).`,
          "Headline statistics are the locked research summary.",
          howToReplace,
        ]
  )
    .filter(Boolean)
    .join(" ");
  const { validation } = summary;
  const chartBadge = pendingDaily
    ? "Daily dump pending"
    : "Research daily";

  return (
    <div className="pb-16">
      <Container className="pt-10 pb-6 sm:pt-14">
        <p className="text-sm font-medium text-accent">
          Hypothetical research · not live trading
        </p>
        <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Four-market 12–1 month TSMOM
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-ink-muted">
          A monthly time-series momentum swing book on US30 (USA30), NAS100
          (USATECH), XAUUSD (gold), and DE40 (DEU40). History is Dukascopy,
          after costs, January 2016 to August 2026. This is not the{" "}
          <Link
            href="/backtesting"
            className="font-medium text-accent hover:text-accent-hover"
          >
            H4 Donchian
          </Link>{" "}
          archive entry, not the{" "}
          <Link
            href="/backtesting/dual-momentum"
            className="font-medium text-accent hover:text-accent-hover"
          >
            dual-momentum
          </Link>{" "}
          book, not the live forex day-trading book on{" "}
          <Link
            href="/results"
            className="font-medium text-accent hover:text-accent-hover"
          >
            Results
          </Link>
          , and it is not a clean 20% compound claim.
        </p>

        <div className="mt-6">
          <Disclaimer />
        </div>

        <section
          aria-label="Material caveats"
          className="mt-6 rounded-lg border border-negative/40 bg-negative-soft px-5 py-5 shadow-card sm:px-6"
        >
          <p className="text-xs font-semibold tracking-wide text-negative uppercase">
            Read this before the headline numbers
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-ink">
            <li>
              Highest full-sample CAGR of the three archived books (
              <strong className="font-semibold">
                {formatSignedPercent(summary.cagrPct, 2)}
              </strong>
              ) but{" "}
              <strong className="font-semibold">
                {formatSignedPercent(summary.maxDrawdownPct, 1)} max drawdown
              </strong>
              . Donchian (−21.3%) is far more livable.
            </li>
            <li>
              In-sample to end-2023 is only{" "}
              <strong className="font-semibold">
                {formatSignedPercent(validation.inSampleCagrPct, 2)} CAGR
              </strong>
              , still with{" "}
              <strong className="font-semibold">
                {formatSignedPercent(validation.inSampleMaxDrawdownPct, 1)}{" "}
                drawdown
              </strong>
              . Most of the profit sits in 2024–26 (holdout{" "}
              {formatSignedPercent(validation.oosResetCagrPct, 1)}; about{" "}
              {formatPercent(validation.poundsShare2024To2026Pct, 0)} of
              pounds).
            </li>
            <li>
              Gold is about{" "}
              <strong className="font-semibold">half of closed P&amp;L</strong>{" "}
              (£27,127). The four-market story is not a balanced sleeve.
            </li>
            <li>
              This page is archived because full-sample after-costs CAGR is ≥
              15%,{" "}
              <strong className="font-semibold">
                not because TSMOM is preferred over Donchian on risk
              </strong>
              .
            </li>
            <li>
              These figures are{" "}
              <strong className="font-semibold">hypothetical</strong>. They are
              not a live track record, and they are not advice.
            </li>
          </ul>
        </section>

        <div className="mt-6">
          <ResearchArchive
            rule={archive.rule}
            books={archive.books}
            currentHref="/backtesting/tsmom"
          />
        </div>

        <section
          aria-label="Headline backtest statistics"
          className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <StatCard
            label="Ending equity"
            value={formatMoneyWhole(summary.endingEquity, summary.currency)}
            caption={`From ${formatMoneyWhole(summary.startingEquity, summary.currency)} · ${summary.periodLabel} · ${summary.vendor}`}
          />
          <StatCard
            label="CAGR"
            value={formatSignedPercent(summary.cagrPct, 2)}
            caption="Full window headline — see caveats"
          />
          <StatCard
            label="Max drawdown"
            value={formatSignedPercent(summary.maxDrawdownPct, 1)}
            caption="Peak to trough · worse than Donchian · intra-year"
            tone="negative"
          />
          <StatCard
            label="Sharpe"
            value={formatNumber(summary.sharpe, 2)}
            caption="After costs · research book"
          />
          <StatCard
            label="Trades"
            value={formatNumber(summary.trades, 0)}
            caption="Closed trades in the research book"
          />
          <StatCard
            label="Win rate"
            value={formatPercent(summary.winRatePct, 1)}
            caption="Low hit rate · fat right tail"
          />
          <StatCard
            label="Profit factor"
            value={formatNumber(summary.profitFactor, 2)}
            caption="Gross profit / gross loss"
          />
          <StatCard
            label="Net P&L"
            value={formatMoneyWhole(summary.netPnl, summary.currency)}
            caption={`${formatMoneyWhole(summary.startingEquity, summary.currency)} starting equity`}
          />
        </section>

        <section
          aria-label="Validation splits"
          className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          <StatCard
            label="In-sample CAGR"
            value={formatSignedPercent(validation.inSampleCagrPct, 2)}
            caption={`To ${validation.inSampleTo} · implied ${formatMoney(validation.inSampleEquity, summary.currency)} · still ${formatSignedPercent(validation.inSampleMaxDrawdownPct, 1)} DD`}
          />
          <StatCard
            label="Holdout CAGR"
            value={formatSignedPercent(validation.oosResetCagrPct, 1)}
            caption={`${validation.oosResetPeriod} OOS window`}
          />
          <StatCard
            label="Walk-forward OOS"
            value={formatSignedPercent(validation.walkForwardOosCagrPct, 1)}
            caption={`Concatenated OOS · DD ${formatSignedPercent(validation.walkForwardOosMaxDrawdownPct, 1)}`}
          />
          <StatCard
            label="Cash months"
            value={`${validation.cashMonths} / ${validation.totalMonths}`}
            caption={validation.cashMonthsNote}
          />
          <StatCard
            label="2024–26 pound share"
            value={formatPercent(validation.poundsShare2024To2026Pct, 0)}
            caption="Most of the net result sits after the in-sample cut"
          />
          <StatCard
            label="Spread stress CAGR"
            value={formatSignedPercent(validation.spreadStressCagrPct, 2)}
            caption={validation.spreadStress}
          />
          <StatCard
            label="Max open"
            value={formatNumber(validation.maxOpenPositions, 0)}
            caption="Cap when more than three names are eligible"
          />
          <StatCard
            label="Costs"
            value="Matched Donchian"
            caption={summary.costsNote}
          />
        </section>

        <div className="mt-6">
          <BacktestEquityChart
            points={chartPoints}
            annotations={equity.annotations}
            caption={chartCaption}
            badge={chartBadge}
            emptyLabel="Daily series pending"
          />
        </div>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-ink">
            Per-market contribution
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-muted">
            Approximate closed P&amp;L across{" "}
            {formatMoneyWhole(markets.netPnl, summary.currency)}. Gold made
            about half; Nasdaq, Dow, and DAX the rest. Months selected can
            overlap because the book holds up to three eligible names.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {markets.markets.map((market) => {
              const negative = market.pnl < 0;
              return (
                <article
                  key={market.id}
                  className="rounded-lg border border-border bg-surface p-5 shadow-card"
                >
                  <p className="text-xs font-medium tracking-wide text-ink-muted uppercase">
                    {market.broker}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-ink">
                    {market.label}
                  </h3>
                  <p
                    className={`mt-3 text-[1.75rem] leading-none font-semibold tracking-tight tabular-nums ${
                      negative ? "text-negative" : "text-ink"
                    }`}
                  >
                    {formatMoneyWhole(market.pnl, summary.currency)}
                  </p>
                  <p className="mt-3 text-sm text-ink-muted">
                    {formatSignedPercent(market.sharePct, 1)} of closed P&amp;L.
                    {market.trades != null ? ` ${market.trades} trades.` : ""}
                    {market.monthsSelected != null
                      ? ` Selected in ${market.monthsSelected} months.`
                      : ""}{" "}
                    {market.note}
                  </p>
                </article>
              );
            })}
          </div>

          <div className="mt-6 overflow-hidden rounded-lg border border-border bg-surface shadow-card">
            <div className="border-b border-border px-5 py-4">
              <h3 className="text-sm font-semibold text-ink">
                Market P&amp;L table
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-bg text-xs tracking-wide text-ink-muted uppercase">
                  <tr>
                    <th className="px-5 py-3 font-medium">Market</th>
                    <th className="px-5 py-3 font-medium">Broker symbol</th>
                    <th className="px-5 py-3 font-medium">P&amp;L</th>
                    <th className="px-5 py-3 font-medium">Months</th>
                    <th className="px-5 py-3 font-medium">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {markets.markets.map((market) => {
                    const negative = market.pnl < 0;
                    return (
                      <tr key={market.id} className="border-t border-border">
                        <td className="px-5 py-3 text-ink">{market.label}</td>
                        <td className="px-5 py-3 font-mono text-xs">
                          {market.broker}
                        </td>
                        <td
                          className={`px-5 py-3 tabular-nums ${
                            negative
                              ? "bg-negative-soft text-negative"
                              : "bg-positive-soft text-positive"
                          }`}
                        >
                          {formatMoneyWhole(market.pnl, summary.currency)}
                        </td>
                        <td className="px-5 py-3 tabular-nums">
                          {formatNumber(market.monthsSelected, 0)}
                        </td>
                        <td
                          className={`px-5 py-3 tabular-nums ${
                            negative ? "text-negative" : "text-ink"
                          }`}
                        >
                          {formatSignedPercent(market.sharePct, 1)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <p className="mt-3 text-xs text-ink-muted">{markets.note}</p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-ink">Yearly returns</h2>
          {years.years.length === 0 ? (
            <div className="mt-4 rounded-lg border border-border bg-surface px-5 py-5 shadow-card">
              <p className="text-sm leading-6 text-ink-muted">
                {years.note} Locked splits we do have: in-sample to{" "}
                {validation.inSampleTo} at{" "}
                <strong className="font-semibold text-ink">
                  {formatSignedPercent(validation.inSampleCagrPct, 2)} CAGR
                </strong>{" "}
                (still{" "}
                {formatSignedPercent(validation.inSampleMaxDrawdownPct, 1)}{" "}
                drawdown); 2024–26 holdout{" "}
                <strong className="font-semibold text-ink">
                  {formatSignedPercent(validation.oosResetCagrPct, 1)}
                </strong>
                , about{" "}
                {formatPercent(validation.poundsShare2024To2026Pct, 0)} of
                net pounds. Walk-forward OOS concat{" "}
                {formatSignedPercent(validation.walkForwardOosCagrPct, 1)} with{" "}
                {formatSignedPercent(
                  validation.walkForwardOosMaxDrawdownPct,
                  1,
                )}{" "}
                drawdown.
              </p>
            </div>
          ) : (
            <>
              <p className="mt-2 max-w-2xl text-sm text-ink-muted">
                Locked year-end equity from the research book. The{" "}
                <strong className="font-semibold text-ink">
                  {formatSignedPercent(summary.maxDrawdownPct, 1)} max
                  drawdown
                </strong>{" "}
                is intra-year and does not appear as a year-end print.
              </p>
              <div className="mt-4 overflow-hidden rounded-lg border border-border bg-surface shadow-card">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-bg text-xs tracking-wide text-ink-muted uppercase">
                      <tr>
                        <th className="px-5 py-3 font-medium">Year</th>
                        <th className="px-5 py-3 font-medium">Start</th>
                        <th className="px-5 py-3 font-medium">End</th>
                        <th className="px-5 py-3 font-medium">P&amp;L</th>
                        <th className="px-5 py-3 font-medium">Return</th>
                      </tr>
                    </thead>
                    <tbody>
                      {years.years.map((row) => {
                        const negative = row.netPnl < 0;
                        const flat = row.netPnl === 0;
                        return (
                          <tr key={row.year} className="border-t border-border">
                            <td className="px-5 py-3 text-ink">
                              {row.year}
                              {row.partial ? (
                                <span className="ml-2 text-xs text-ink-muted">
                                  YTD
                                </span>
                              ) : null}
                            </td>
                            <td className="px-5 py-3 tabular-nums text-ink-muted">
                              {formatMoney(row.startEquity, summary.currency)}
                            </td>
                            <td className="px-5 py-3 tabular-nums">
                              {formatMoney(row.endEquity, summary.currency)}
                            </td>
                            <td
                              className={`px-5 py-3 tabular-nums ${
                                negative
                                  ? "bg-negative-soft text-negative"
                                  : flat
                                    ? "text-ink-muted"
                                    : "bg-positive-soft text-positive"
                              }`}
                            >
                              {formatMoney(row.netPnl, summary.currency)}
                            </td>
                            <td
                              className={`px-5 py-3 tabular-nums ${
                                negative
                                  ? "text-negative"
                                  : flat
                                    ? "text-ink-muted"
                                    : "text-positive"
                              }`}
                            >
                              {formatSignedPercent(row.returnPct)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-ink">Rules in force</h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-muted">
            Written parameters for this research run. They are not the H4
            Donchian rules on{" "}
            <Link
              href="/backtesting"
              className="font-medium text-accent hover:text-accent-hover"
            >
              Backtesting
            </Link>
            , not the dual-momentum rank on{" "}
            <Link
              href="/backtesting/dual-momentum"
              className="font-medium text-accent hover:text-accent-hover"
            >
              Dual momentum
            </Link>
            , and not the opening-range day-trading method on{" "}
            <Link
              href="/method"
              className="font-medium text-accent hover:text-accent-hover"
            >
              Method
            </Link>
            .
          </p>
          <dl className="mt-4 grid gap-4 md:grid-cols-2">
            {TSMOM_RULES.map((rule) => (
              <div
                key={rule.title}
                className="rounded-lg border border-border bg-surface p-5 shadow-card"
              >
                <dt className="text-sm font-semibold text-ink">{rule.title}</dt>
                <dd className="mt-2 text-sm leading-6 text-ink-muted">
                  {rule.body}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="mt-10">
          <BacktestTrades
            trades={trades.trades}
            sample={trades.sample}
            fullTradeCount={trades.fullTradeCount}
            note={trades.note}
            howToReplace={trades.howToReplace}
            marketFilters={TSMOM_MARKET_FILTERS}
            dataFile="public/data/backtesting/tsmom/trades.json"
          />
        </div>

        <div className="mt-6">
          <PerformanceNote />
        </div>
      </Container>
    </div>
  );
}
