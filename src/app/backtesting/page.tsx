import type { Metadata } from "next";
import Link from "next/link";
import { BacktestEquityChart } from "@/components/backtest-equity-chart";
import { BacktestTrades } from "@/components/backtest-trades";
import { Container } from "@/components/container";
import { Disclaimer, PerformanceNote } from "@/components/disclaimer";
import { ResearchArchive } from "@/components/research-archive";
import { StatCard } from "@/components/stat-card";
import {
  BACKTEST_MARKETS,
  BACKTEST_RULES,
  BACKTEST_SUMMARY,
  downsampleEquity,
  sourceHowToReplace,
} from "@/lib/backtesting";
import {
  loadBacktestArchive,
  loadBacktestTrades,
  loadEquityCurve,
} from "@/lib/load-backtesting";
import { formatMoney, formatNumber, formatPercent } from "@/lib/format";

export const metadata: Metadata = {
  title: "Backtesting",
  description:
    "Hypothetical multi-market H4 Donchian trend backtest on Dukascopy history, 2016–2026. Not live trading results and not financial advice.",
};

const MARKET_BAR = [
  { id: "XAUUSD", className: "bg-accent" },
  { id: "US30", className: "bg-ink" },
  { id: "DE40", className: "bg-ink-muted" },
  { id: "NAS100", className: "bg-[#94A3B8]" },
] as const;

export default async function BacktestingPage() {
  const [equity, trades, archive] = await Promise.all([
    loadEquityCurve(),
    loadBacktestTrades(),
    loadBacktestArchive(),
  ]);

  const chartPoints = downsampleEquity(
    equity.points,
    equity.annotations.map((item) => item.date),
  );
  const chartCaption = [
    equity.source.label,
    `Series runs from ${equity.startDate} to ${equity.endDate} (${new Intl.NumberFormat("en-GB").format(equity.points.length)} weekdays; chart downsampled for display).`,
    "Headline statistics are the research summary; the line is a smooth reconstruction that hits those checkpoints, including the mid-sample drawdown.",
    sourceHowToReplace(equity.source),
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="pb-16">
      <Container className="pt-10 pb-6 sm:pt-14">
        <p className="text-sm font-medium text-accent">
          Hypothetical research · not live trading
        </p>
        <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Multi-market H4 Donchian trend backtest
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-ink-muted">
          An approved swing system on US30, NAS100 (USATECH), XAUUSD (gold),
          and DE40. History is Dukascopy, roughly 2016–2026. This is not the
          live forex day-trading book on{" "}
          <Link
            href="/results"
            className="font-medium text-accent hover:text-accent-hover"
          >
            Results
          </Link>
          , and it is not a 20% compound claim.
        </p>

        <div className="mt-6">
          <Disclaimer />
        </div>

        <section
          aria-label="Material caveats"
          className="mt-6 rounded-lg border border-border bg-surface px-5 py-5 shadow-card sm:px-6"
        >
          <p className="text-xs font-semibold tracking-wide text-negative uppercase">
            Read this before the headline numbers
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-ink">
            <li>
              In-sample to end-2023 is about{" "}
              <strong className="font-semibold">+14% CAGR</strong> — not 18.7%.
            </li>
            <li>
              Much of the profit sits in{" "}
              <strong className="font-semibold">2024–25</strong>, when gold
              carried the book.
            </li>
            <li>
              Gold is about{" "}
              <strong className="font-semibold">49% of net P&amp;L</strong>. The
              four-market story is not a balanced sleeve.
            </li>
            <li>
              Calendar <strong className="font-semibold">2022 was −16%</strong>.
              Peak-to-trough max drawdown is{" "}
              <strong className="font-semibold">−21.3%</strong>.
            </li>
            <li>
              These figures are{" "}
              <strong className="font-semibold">hypothetical</strong>. They are
              not a clean 20% live track record, and they are not advice.
            </li>
          </ul>
        </section>

        <div className="mt-6">
          <ResearchArchive
            rule={archive.rule}
            books={archive.books}
            currentHref="/backtesting"
          />
        </div>

        <section
          aria-label="Headline backtest statistics"
          className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          <StatCard
            label="Ending equity"
            value="£31,097"
            caption={`From £5,000 · ${BACKTEST_SUMMARY.periodLabel} · ${BACKTEST_SUMMARY.vendor}`}
          />
          <StatCard
            label="CAGR"
            value={formatPercent(BACKTEST_SUMMARY.cagrPct, 2)}
            caption="Full window headline — see caveats"
          />
          <StatCard
            label="Max drawdown"
            value={formatPercent(BACKTEST_SUMMARY.maxDrawdownPct)}
            caption="Peak to trough"
            tone="negative"
          />
          <StatCard
            label="Trades"
            value={formatNumber(BACKTEST_SUMMARY.trades, 0)}
            caption="Closed trades in the research book"
          />
          <StatCard
            label="Profit factor"
            value={formatNumber(BACKTEST_SUMMARY.profitFactor, 2)}
            caption="Gross profit / gross loss"
          />
          <StatCard
            label="Net P&L"
            value={formatMoney(BACKTEST_SUMMARY.netPnl, "GBP")}
            caption="£5,000 starting equity"
          />
        </section>

        <div className="mt-6">
          <BacktestEquityChart
            points={chartPoints}
            annotations={equity.annotations}
            caption={chartCaption}
          />
        </div>

        <section className="mt-10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-ink">
                Per-market contribution
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-ink-muted">
                Approximate share of the £26,097 net result. Shares are rounded
                research totals, not a live allocation.
              </p>
            </div>
          </div>

          <div
            className="mt-4 flex h-3 overflow-hidden rounded-pill border border-border"
            aria-hidden
          >
            {BACKTEST_MARKETS.map((market) => {
              const tone = MARKET_BAR.find((item) => item.id === market.id);
              return (
                <div
                  key={market.id}
                  className={tone?.className ?? "bg-accent"}
                  style={{ width: `${market.sharePct}%` }}
                  title={`${market.label} ${market.sharePct}%`}
                />
              );
            })}
          </div>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-muted">
            {BACKTEST_MARKETS.map((market) => (
              <li key={market.id} className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    MARKET_BAR.find((item) => item.id === market.id)?.className ??
                    "bg-accent"
                  }`}
                />
                {market.label} {market.sharePct}%
              </li>
            ))}
          </ul>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {BACKTEST_MARKETS.map((market) => (
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
                <p className="mt-3 text-[1.75rem] leading-none font-semibold tracking-tight tabular-nums text-ink">
                  {formatMoney(market.pnl, "GBP")}
                </p>
                <p className="mt-3 text-sm text-ink-muted">
                  {market.sharePct}% of net P&amp;L. {market.note}
                </p>
              </article>
            ))}
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
                    <th className="px-5 py-3 font-medium">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {BACKTEST_MARKETS.map((market) => (
                    <tr key={market.id} className="border-t border-border">
                      <td className="px-5 py-3 text-ink">{market.label}</td>
                      <td className="px-5 py-3 font-mono text-xs">
                        {market.broker}
                      </td>
                      <td className="bg-positive-soft px-5 py-3 tabular-nums text-positive">
                        {formatMoney(market.pnl, "GBP")}
                      </td>
                      <td className="px-5 py-3 tabular-nums">
                        {formatPercent(market.sharePct, 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-ink">Yearly returns</h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-muted">
            Derived from the reconstructed path so the table matches the chart.
            2022 is pinned at −16%. 2024–25 hold most of the remaining gain.
            2026 is a partial year to 28 August.
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
                  {equity.yearlyReturns.map((row) => {
                    const negative = row.netPnl < 0;
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
                          {formatMoney(row.startEquity, "GBP")}
                        </td>
                        <td className="px-5 py-3 tabular-nums">
                          {formatMoney(row.endEquity, "GBP")}
                        </td>
                        <td
                          className={`px-5 py-3 tabular-nums ${
                            negative
                              ? "bg-negative-soft text-negative"
                              : "bg-positive-soft text-positive"
                          }`}
                        >
                          {formatMoney(row.netPnl, "GBP")}
                        </td>
                        <td
                          className={`px-5 py-3 tabular-nums ${
                            negative ? "text-negative" : "text-positive"
                          }`}
                        >
                          {formatPercent(row.returnPct)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-ink">Rules in force</h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-muted">
            Written parameters for this research run. They are not the
            opening-range day-trading method on{" "}
            <Link
              href="/method"
              className="font-medium text-accent hover:text-accent-hover"
            >
              Method
            </Link>
            .
          </p>
          <dl className="mt-4 grid gap-4 md:grid-cols-2">
            {BACKTEST_RULES.map((rule) => (
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
          />
        </div>

        <div className="mt-6">
          <PerformanceNote />
        </div>
      </Container>
    </div>
  );
}
