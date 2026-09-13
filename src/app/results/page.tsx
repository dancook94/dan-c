import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/container";
import { LineChart } from "@/components/line-chart";
import { MonthlyTable } from "@/components/monthly-table";
import { PerformanceNote } from "@/components/disclaimer";
import { RangePills } from "@/components/range-pills";
import { StatCard } from "@/components/stat-card";
import { TradeLog } from "@/components/trade-log";
import {
  formatMoney,
  formatNumber,
  formatPercent,
} from "@/lib/format";
import { loadResults } from "@/lib/results";

export const metadata: Metadata = {
  title: "Results",
  description:
    "Public performance shell for the dan-c forex day-trading system. Live figures appear only when the track record is published.",
};

export default async function ResultsPage() {
  const results = await loadResults();
  const comingSoon = results.status !== "live";
  const caption = comingSoon
    ? "Coming soon"
    : results.asOf
      ? `As of ${results.asOf}`
      : "All time";

  return (
    <div className="pb-16">
      <Container className="pt-10 pb-6 sm:pt-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Results
            </h1>
            <p className="mt-2 text-ink-muted">
              Paper and live performance only. Figures appear when exported from
              that book — never invented for this page. The historical H4
              Donchian research book is on{" "}
              <Link
                href="/backtesting"
                className="font-medium text-accent hover:text-accent-hover"
              >
                Backtesting
              </Link>
              ; do not read those numbers as a live track record.
            </p>
          </div>
          <RangePills />
        </div>

        <div className="mt-8 space-y-4">
          <LineChart
            title="Equity curve"
            yLabel={`Account equity (${results.currency})`}
            caption={
              comingSoon
                ? "Shell only until the first live export"
                : caption
            }
            emptyLabel="Coming soon"
            points={results.equityCurve.map((point) => ({
              date: point.date,
              value: point.equity,
            }))}
          />
          <LineChart
            title="Drawdown"
            yLabel="Drawdown (%)"
            caption={comingSoon ? "No drawdown series published yet" : caption}
            emptyLabel="Coming soon"
            stroke="var(--dc-negative)"
            points={results.drawdown.map((point) => ({
              date: point.date,
              value: point.drawdownPct,
            }))}
          />
        </div>

        <section
          aria-label="Key metrics"
          className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
        >
          <StatCard
            label="Net P&L"
            value={formatMoney(results.kpis.netPnl, results.currency)}
            caption={caption}
          />
          <StatCard
            label="Win rate"
            value={formatPercent(results.kpis.winRate)}
            caption={caption}
          />
          <StatCard
            label="Profit factor"
            value={formatNumber(results.kpis.profitFactor, 3)}
            caption={caption}
          />
          <StatCard
            label="Max DD"
            value={formatPercent(results.kpis.maxDrawdown)}
            caption={caption}
            tone="negative"
          />
          <StatCard
            label="Average trade"
            value={formatMoney(results.kpis.avgTrade, results.currency)}
            caption={caption}
          />
        </section>

        <div className="mt-6">
          <MonthlyTable
            rows={results.monthlyReturns}
            currency={results.currency}
          />
        </div>
        <div className="mt-6">
          <TradeLog trades={results.trades} currency={results.currency} />
        </div>
        <div className="mt-6">
          <PerformanceNote />
        </div>
      </Container>
    </div>
  );
}
