import type { Metadata } from "next";
import Link from "next/link";
import { BacktestEquityChart } from "@/components/backtest-equity-chart";
import { BacktestTrades } from "@/components/backtest-trades";
import { Container } from "@/components/container";
import { Disclaimer, PerformanceNote } from "@/components/disclaimer";
import { StatCard } from "@/components/stat-card";
import type { EquityAnnotation } from "@/lib/backtesting";
import {
  FORWARD_TEST_EMPTY_MESSAGE,
  FORWARD_TEST_LABEL,
} from "@/lib/forward-test";
import { loadForwardTestSummary } from "@/lib/forward-test-store";
import {
  formatMoney,
  formatNumber,
  formatPercent,
  formatSignedPercent,
} from "@/lib/format";

export const metadata: Metadata = {
  title: "Forward test",
  description:
    "Demo-account forward test of the multi-market H4 Donchian book on a Pepperstone UK MT5 demo. Not live money and not financial advice.",
};

export const revalidate = 300;

function formatStamp(iso: string | null) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}

export default async function ForwardTestPage() {
  const summary = await loadForwardTestSummary();
  const awaitingTrades = summary.emptyMessage !== null && summary.status !== "unavailable";
  const annotations: EquityAnnotation[] =
    summary.maxDrawdownAt && summary.maxDrawdownPct !== null
      ? [
          {
            date: summary.maxDrawdownAt,
            type: "max_drawdown",
            label: "Max DD",
            value: summary.maxDrawdownPct,
          },
        ]
      : [];

  const equityCaption =
    summary.status === "unavailable"
      ? "The equity feed could not be read. This page retries about every five minutes."
      : summary.equitySource === "snapshot"
        ? `Demo equity snapshots, including the £5,000 start on ${summary.startLabel}. Latest snapshot ${formatStamp(summary.equityAsOf)}.`
        : summary.equitySource === "reconstructed"
          ? "No equity snapshot has arrived yet. This line is the £5,000 start plus closed P&L only, so open profit and loss is missing."
          : "The curve appears when the Expert Advisor posts an equity snapshot.";

  const currentCaption =
    summary.equitySource === "snapshot"
      ? `Latest snapshot ${formatStamp(summary.equityAsOf)}`
      : summary.equitySource === "reconstructed"
        ? "Closed P&L only — no equity snapshot yet"
        : "Waiting for the first equity snapshot";

  return (
    <div className="pb-16">
      <Container className="pt-10 pb-6 sm:pt-14">
        <p className="text-sm font-medium text-accent">{FORWARD_TEST_LABEL}</p>
        <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          H4 Donchian forward test
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-ink-muted">
          The approved long-only book — US30, NAS100, XAUUSD, and DE40, 1% risk
          — running on a {summary.account}, started at{" "}
          {formatMoney(summary.startingEquity, "GBP")} on {summary.startLabel}.
          Compare it with the hypothetical 2016–2026 research on{" "}
          <Link
            href="/backtesting"
            className="font-medium text-accent hover:text-accent-hover"
          >
            Backtesting
          </Link>
          . This is not the live forex day-trading book on{" "}
          <Link
            href="/results"
            className="font-medium text-accent hover:text-accent-hover"
          >
            Results
          </Link>
          .
        </p>

        <div className="mt-6">
          <Disclaimer />
        </div>

        <section
          aria-label="Demo account notice"
          className="mt-6 rounded-lg border border-border bg-surface px-5 py-5 shadow-card sm:px-6"
        >
          <p className="text-xs font-semibold tracking-wide text-negative uppercase">
            {FORWARD_TEST_LABEL}
          </p>
          <p className="mt-3 text-sm leading-6 text-ink">
            These figures are a Pepperstone UK MT5 <strong className="font-semibold">demo</strong>{" "}
            forward test. They are not live client money, not a funded track
            record, and not a promise that the backtest will repeat.
          </p>
          {summary.status === "unavailable" ? (
            <p className="mt-3 text-sm leading-6 text-ink">
              The forward-test feed is temporarily unavailable.
            </p>
          ) : null}
          {summary.storage === "unconfigured" ? (
            <p className="mt-3 text-sm leading-6 text-ink-muted">
              Event storage is not connected yet. On Vercel, create a Blob store
              so <code className="font-mono text-xs">BLOB_READ_WRITE_TOKEN</code> is
              set, then redeploy.
            </p>
          ) : null}
          {awaitingTrades ? (
            <p className="mt-3 text-sm font-medium text-ink">
              {FORWARD_TEST_EMPTY_MESSAGE}
            </p>
          ) : null}
        </section>

        <section
          aria-label="Forward-test headline statistics"
          className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <StatCard
            label="Start date"
            value={summary.startLabel}
            caption={summary.account}
          />
          <StatCard
            label="Starting equity"
            value={formatMoney(summary.startingEquity, "GBP")}
            caption="Demo deposit"
          />
          <StatCard
            label="Current equity"
            value={formatMoney(summary.currentEquity, "GBP")}
            caption={
              summary.balance === null
                ? currentCaption
                : `${currentCaption} · Balance ${formatMoney(summary.balance, "GBP")}`
            }
          />
          <StatCard
            label="Return"
            value={formatSignedPercent(summary.returnPct, 2)}
            caption="From the £5,000 start"
            tone={
              summary.returnPct !== null && summary.returnPct < 0
                ? "negative"
                : "default"
            }
          />
          <StatCard
            label="Max drawdown"
            value={formatPercent(summary.maxDrawdownPct, 2)}
            caption="Peak to trough"
            tone="negative"
          />
          <StatCard
            label="Trades closed"
            value={formatNumber(summary.tradesClosed, 0)}
            caption={
              summary.tradesOpen > 0
                ? `${formatNumber(summary.tradesOpen, 0)} still open`
                : "Demo fills"
            }
          />
          <StatCard
            label="Win rate"
            value={formatPercent(summary.winRatePct, 1)}
            caption={
              summary.tradesClosed > 0
                ? `${summary.wins} of ${summary.tradesClosed} closed above zero`
                : "Closed trades only"
            }
          />
          <StatCard
            label="Average R"
            value={formatNumber(summary.avgR, 2)}
            caption="Mean R-multiple on closed trades"
          />
        </section>

        <section className="mt-10" aria-label="Live figures beside the backtest">
          <h2 className="text-xl font-semibold text-ink">
            Demo figures beside the backtest
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-ink-muted">
            The research book ({summary.expectations.periodLabel}) expected a win
            rate around {summary.expectations.winRatePct}%, a profit factor of{" "}
            {formatNumber(summary.expectations.profitFactor, 2)}, and about{" "}
            {summary.expectations.avgTradesPerMonth} closed trades a month across
            the four markets. Full-sample CAGR was{" "}
            {formatPercent(summary.expectations.cagrPct, 1)} with a max drawdown
            of {formatPercent(summary.expectations.maxDrawdownPct, 1)} over{" "}
            {formatNumber(summary.expectations.trades, 0)} trades. Read the
            caveats on{" "}
            <Link
              href={summary.expectations.href}
              className="font-medium text-accent hover:text-accent-hover"
            >
              Backtesting
            </Link>
            . A short demo sample will not match those rates.
          </p>
          <div className="mt-4 overflow-hidden rounded-lg border border-border bg-surface shadow-card">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-bg text-xs tracking-wide text-ink-muted uppercase">
                  <tr>
                    <th className="px-5 py-3 font-medium">Metric</th>
                    <th className="px-5 py-3 font-medium">This demo</th>
                    <th className="px-5 py-3 font-medium">Backtest expectation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border">
                    <td className="px-5 py-3 text-ink">Win rate</td>
                    <td className="px-5 py-3 tabular-nums">
                      {formatPercent(summary.winRatePct, 1)}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-ink-muted">
                      ~{summary.expectations.winRatePct}%
                    </td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="px-5 py-3 text-ink">Profit factor</td>
                    <td className="px-5 py-3 tabular-nums">
                      {formatNumber(summary.profitFactor, 2)}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-ink-muted">
                      {formatNumber(summary.expectations.profitFactor, 2)}
                    </td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="px-5 py-3 text-ink">Trades / month</td>
                    <td className="px-5 py-3 tabular-nums">
                      {formatNumber(summary.tradesPerMonth, 1)}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-ink-muted">
                      ~{summary.expectations.avgTradesPerMonth}
                    </td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="px-5 py-3 text-ink">Max drawdown</td>
                    <td className="px-5 py-3 tabular-nums">
                      {formatPercent(summary.maxDrawdownPct, 2)}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-ink-muted">
                      {formatPercent(summary.expectations.maxDrawdownPct, 1)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <div className="mt-6">
          <BacktestEquityChart
            points={summary.equityCurve}
            annotations={annotations}
            caption={equityCaption}
            title="Demo equity curve"
            seriesLabel="Account equity (GBP)"
            badge="Demo forward test"
            emptyLabel="No equity snapshots yet"
            axis="day"
            yDomain={["dataMin - 40", "dataMax + 40"]}
          />
        </div>

        <section className="mt-10" aria-label="Open positions">
          <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold text-ink">Open positions</h2>
              <p className="mt-1 text-xs text-ink-muted">
                {summary.tradesOpen === 0
                  ? "None open"
                  : `${summary.tradesOpen} open on the demo`}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-bg text-xs tracking-wide text-ink-muted uppercase">
                  <tr>
                    <th className="px-5 py-3 font-medium">Opened</th>
                    <th className="px-5 py-3 font-medium">ID</th>
                    <th className="px-5 py-3 font-medium">Market</th>
                    <th className="px-5 py-3 font-medium">Symbol</th>
                    <th className="px-5 py-3 font-medium">Side</th>
                    <th className="px-5 py-3 font-medium">Entry</th>
                    <th className="px-5 py-3 font-medium">Stop</th>
                    <th className="px-5 py-3 font-medium">Lots</th>
                    <th className="px-5 py-3 font-medium">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.openPositions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-5 py-10 text-center text-ink-muted"
                      >
                        {awaitingTrades
                          ? FORWARD_TEST_EMPTY_MESSAGE
                          : "No open positions."}
                      </td>
                    </tr>
                  ) : (
                    summary.openPositions.map((position) => (
                      <tr key={position.id} className="border-t border-border">
                        <td className="px-5 py-3 text-ink-muted">
                          {formatStamp(position.openedAt)}
                        </td>
                        <td className="px-5 py-3 font-mono text-xs">{position.id}</td>
                        <td className="px-5 py-3">{position.market}</td>
                        <td className="px-5 py-3 font-mono text-xs">
                          {position.symbol ?? "—"}
                        </td>
                        <td className="px-5 py-3 capitalize">{position.side}</td>
                        <td className="px-5 py-3 tabular-nums">
                          {formatNumber(position.entry, 5)}
                        </td>
                        <td className="px-5 py-3 tabular-nums">
                          {formatNumber(position.stop, 5)}
                        </td>
                        <td className="px-5 py-3 tabular-nums">
                          {formatNumber(position.lots, 2)}
                        </td>
                        <td className="px-5 py-3 tabular-nums">
                          {formatPercent(position.riskPct, 2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <div className="mt-10">
          <BacktestTrades
            trades={summary.closedTrades}
            sample={false}
            fullTradeCount={summary.tradesClosed}
            note=""
            howToReplace=""
            title="Closed trades"
            emptyMessage={
              awaitingTrades ? FORWARD_TEST_EMPTY_MESSAGE : "No closed trades yet."
            }
            showTime
            showDetail
          />
        </div>

        <div className="mt-6">
          <PerformanceNote />
        </div>
      </Container>
    </div>
  );
}
