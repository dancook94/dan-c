import type { Metadata } from "next";
import Link from "next/link";
import { BacktestEquityChart } from "@/components/backtest-equity-chart";
import { BacktestTrades } from "@/components/backtest-trades";
import { Container } from "@/components/container";
import { Disclaimer, PerformanceNote } from "@/components/disclaimer";
import { ResearchArchive } from "@/components/research-archive";
import { StatCard } from "@/components/stat-card";
import {
  VOL_TARGET_MARKET_FILTERS,
  VOL_TARGET_RULES,
} from "@/lib/backtesting-archive";
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
  title: "Vol-target SMA200 backtest",
  description:
    "Hypothetical four-market vol-target SMA200 trend-filter research backtest on Dukascopy history, 2016–2026. Full-sample CAGR +28.17% with −30.33% max drawdown. Not live trading results and not financial advice.",
};

const BOOK = "vol-target";

export default async function VolTargetBacktestPage() {
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
  const sourceType = equity.source?.type;
  const pendingDaily =
    sourceType === "scaffold" || equity.points.length < 2;
  const isDailyResearch =
    sourceType === "research_daily" && equity.points.length >= 50;
  const isInterpolated =
    sourceType === "checkpoint_interpolated" ||
    sourceType === "interpolated" ||
    sourceType === "year_end_interpolated";
  const howToReplace = sourceHowToReplace(equity.source);
  const weekdayCount = new Intl.NumberFormat("en-GB").format(
    equity.points.length,
  );
  const seriesRange = `Series runs from ${equity.startDate} to ${equity.endDate} (${weekdayCount} weekdays; chart downsampled for display).`;
  const maxDd = equity.annotations.find((item) => item.type === "max_drawdown");
  const chartCaption = (
    pendingDaily
      ? [
          equity.source.label,
          "Locked headlines are on this page. The equity path is waiting for a research daily dump.",
          `Headline max drawdown ${formatSignedPercent(summary.maxDrawdownPct, 2)} is intra-year.`,
          howToReplace,
        ]
      : isDailyResearch
        ? [
            equity.source.label,
            seriesRange,
            "These are real daily research points from the fxday vol-target book, downsampled only for display — not checkpoint interpolation.",
            maxDd
              ? `The ${maxDd.label} trough on ${maxDd.date} is marked on the chart.`
              : "Max drawdown is marked on the chart when present in the series.",
            "Headline statistics are the locked research summary.",
            howToReplace,
          ]
        : [
            equity.source.label,
            seriesRange,
            "Headline statistics are the locked research summary.",
            isInterpolated
              ? "The line interpolates locked checkpoints only — not a Dukascopy weekday export."
              : "",
            maxDd
              ? `The ${maxDd.label} trough on 13 March 2020 is marked on the chart.`
              : `Headline max drawdown ${formatSignedPercent(summary.maxDrawdownPct, 2)} is intra-year.`,
            howToReplace,
          ]
  )
    .filter(Boolean)
    .join(" ");
  const { validation } = summary;
  const chartBadge = pendingDaily
    ? "Daily dump pending"
    : isDailyResearch
      ? "Research daily"
      : isInterpolated
        ? "Checkpoint interpolation"
        : "Research equity path";

  return (
    <div className="pb-16">
      <Container className="pt-10 pb-6 sm:pt-14">
        <p className="text-sm font-medium text-accent">
          Hypothetical research · not live trading
        </p>
        <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Four-market vol-target SMA200 trend filter
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-ink-muted">
          A monthly vol-target swing book on US30 (USA30), NAS100 (USATECH),
          XAUUSD (gold), and DE40 (DEU40). History is Dukascopy, after costs,
          January 2016 to August 2026. This is not the{" "}
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
          book, not the{" "}
          <Link
            href="/backtesting/tsmom"
            className="font-medium text-accent hover:text-accent-hover"
          >
            12–1 TSMOM
          </Link>{" "}
          book, not the live forex day-trading book on{" "}
          <Link
            href="/results"
            className="font-medium text-accent hover:text-accent-hover"
          >
            Results
          </Link>
          , and it is not a guarantee of 20% compound.
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
              Clears about 20% full-sample{" "}
              <strong className="font-semibold">
                ({formatSignedPercent(summary.cagrPct, 2)} CAGR)
              </strong>{" "}
              and in-sample{" "}
              <strong className="font-semibold">
                ({formatSignedPercent(validation.inSampleCagrPct, 2)} to
                end-2023)
              </strong>
              — the first four-market book here that does both. That is still
              not a guarantee.
            </li>
            <li>
              Max drawdown is{" "}
              <strong className="font-semibold">
                {formatSignedPercent(summary.maxDrawdownPct, 2)}
              </strong>{" "}
              versus Donchian −21%. More livable than TSMOM / dual momentum
              (−49% to −52%).
            </li>
            <li>
              Gold is about{" "}
              <strong className="font-semibold">62.5% of closed P&amp;L</strong>.
              2017 was a +115–120% outlier. 2024–25 were fat. 2026 is{" "}
              <strong className="font-semibold">−11%</strong> year-to-date.
            </li>
            <li>
              These figures are{" "}
              <strong className="font-semibold">hypothetical</strong>. They are
              not a live track record, and they are not advice.
            </li>
            <li>
              This page is archived because full-sample after-costs CAGR is ≥
              15%,{" "}
              <strong className="font-semibold">
                not because vol-target is preferred over Donchian on risk
              </strong>
              .
            </li>
          </ul>
        </section>

        <div className="mt-6">
          <ResearchArchive
            rule={archive.rule}
            books={archive.books}
            currentHref="/backtesting/vol-target"
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
            value={formatSignedPercent(summary.maxDrawdownPct, 2)}
            caption="Peak to trough · 13 March 2020 · worse than Donchian"
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
            caption={`To ${validation.inSampleTo} · ${formatMoneyWhole(validation.inSampleEquity, summary.currency)} · still ${formatSignedPercent(validation.inSampleMaxDrawdownPct, 2)} DD`}
          />
          <StatCard
            label="Walk-forward OOS"
            value={formatSignedPercent(validation.walkForwardOosCagrPct, 2)}
            caption={`Concatenated OOS · DD ${formatSignedPercent(validation.walkForwardOosMaxDrawdownPct, 1)}`}
          />
          <StatCard
            label="Spread stress CAGR"
            value={formatSignedPercent(validation.spreadStressCagrPct, 2)}
            caption={validation.spreadStress}
          />
          <StatCard
            label="2024–26 pound share"
            value={formatPercent(validation.poundsShare2024To2026Pct, 1)}
            caption="Share of net pounds after the in-sample cut (compounding on a larger base)"
          />
          <StatCard
            label="Max open"
            value={formatNumber(validation.maxOpenPositions, 0)}
            caption="Cap when more than three names are eligible · lowest H4 ATR%"
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
            Locked closed P&amp;L where we have it, across{" "}
            {formatMoneyWhole(markets.netPnl, summary.currency)}. Gold made
            about 62.5%; Dow was selected often and paid about £50. Nasdaq and
            DAX complete the four-name sleeve — their closed P&amp;L is not
            broken out yet. Months selected can overlap because the book holds
            up to three eligible names.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {markets.markets.map((market) => {
              const negative = (market.pnl ?? 0) < 0;
              const unknown = market.pnl == null;
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
                      unknown
                        ? "text-ink-muted"
                        : negative
                          ? "text-negative"
                          : "text-ink"
                    }`}
                  >
                    {unknown
                      ? "Not locked"
                      : formatMoneyWhole(market.pnl, summary.currency)}
                  </p>
                  <p className="mt-3 text-sm text-ink-muted">
                    {market.sharePct != null
                      ? `${formatSignedPercent(market.sharePct, 1)} of closed P&L.`
                      : "Share of closed P&L not locked."}
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
                    const negative = (market.pnl ?? 0) < 0;
                    const unknown = market.pnl == null;
                    return (
                      <tr key={market.id} className="border-t border-border">
                        <td className="px-5 py-3 text-ink">{market.label}</td>
                        <td className="px-5 py-3 font-mono text-xs">
                          {market.broker}
                        </td>
                        <td
                          className={`px-5 py-3 tabular-nums ${
                            unknown
                              ? "text-ink-muted"
                              : negative
                                ? "bg-negative-soft text-negative"
                                : "bg-positive-soft text-positive"
                          }`}
                        >
                          {unknown
                            ? "—"
                            : formatMoneyWhole(market.pnl, summary.currency)}
                        </td>
                        <td className="px-5 py-3 tabular-nums">
                          {market.monthsSelected == null
                            ? "—"
                            : formatNumber(market.monthsSelected, 0)}
                        </td>
                        <td
                          className={`px-5 py-3 tabular-nums ${
                            unknown
                              ? "text-ink-muted"
                              : negative
                                ? "text-negative"
                                : "text-ink"
                          }`}
                        >
                          {market.sharePct == null
                            ? "—"
                            : formatSignedPercent(market.sharePct, 1)}
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
                (
                {formatMoneyWhole(validation.inSampleEquity, summary.currency)}
                ). Walk-forward OOS concat{" "}
                {formatSignedPercent(validation.walkForwardOosCagrPct, 2)} with{" "}
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
                {years.note} The{" "}
                <strong className="font-semibold text-ink">
                  {formatSignedPercent(summary.maxDrawdownPct, 2)} max
                  drawdown
                </strong>{" "}
                is intra-year (13 March 2020) and does not appear as a year-end
                print.
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
            , not the 12–1 TSMOM filter on{" "}
            <Link
              href="/backtesting/tsmom"
              className="font-medium text-accent hover:text-accent-hover"
            >
              TSMOM
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
            {VOL_TARGET_RULES.map((rule) => (
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
            marketFilters={VOL_TARGET_MARKET_FILTERS}
            dataFile="public/data/backtesting/vol-target/trades.json"
          />
        </div>

        <div className="mt-6">
          <PerformanceNote />
        </div>
      </Container>
    </div>
  );
}
