import type { Metadata } from "next";
import Link from "next/link";
import { BacktestChart } from "@/components/backtest-chart";
import { BacktestDisclaimer } from "@/components/backtest-disclaimer";
import { BacktestMarkets } from "@/components/backtest-markets";
import { BacktestRules } from "@/components/backtest-rules";
import { BacktestTrades } from "@/components/backtest-trades";
import { BacktestYears } from "@/components/backtest-years";
import { Container } from "@/components/container";
import { PerformanceNote } from "@/components/disclaimer";
import { StatCard } from "@/components/stat-card";
import { loadBacktest } from "@/lib/backtesting";
import { formatMoney, formatNumber, formatPercent } from "@/lib/format";

export const metadata: Metadata = {
  title: "Backtesting",
  description:
    "Historical backtest of the approved multi-market H4 Donchian trend book. Hypothetical research — not a live track record and not financial advice.",
};

export default async function BacktestingPage() {
  const book = await loadBacktest();
  const { summary, equity, markets, trades, years } = book;
  const sample = summary.sample.label;
  const reconstructed = equity.source === "scaffold-until-fxday-export";

  return (
    <div className="pb-16">
      <Container className="pt-10 pb-6 sm:pt-14">
        <p className="text-sm font-medium text-accent">
          Historical backtest · not live · not paper
        </p>
        <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {summary.book}
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-ink-muted">
          In-depth page for the approved multi-market H4 Donchian research book.
          The numbers below are a historical backtest. They are hypothetical.
          They are not the{" "}
          <Link href="/results" className="font-medium text-accent hover:text-accent-hover">
            Results
          </Link>{" "}
          page, which stays empty until a paper or live export is published.
        </p>

        <div className="mt-8">
          <BacktestDisclaimer caveats={summary.caveats} />
        </div>

        <section
          aria-label="Approved backtest summary"
          className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          <StatCard
            label="Account"
            value={`${formatMoney(summary.kpis.startingEquity, summary.currency, 0)} → ${formatMoney(summary.kpis.endingEquity, summary.currency, 0)}`}
            caption={`Start to end · ${sample}`}
          />
          <StatCard
            label="CAGR"
            value={formatPercent(summary.kpis.cagrPct)}
            caption="18.7% full sample — not a 20% claim"
          />
          <StatCard
            label="Max drawdown"
            value={formatPercent(summary.kpis.maxDrawdownPct)}
            caption="Peak to trough · full sample"
            tone="negative"
          />
          <StatCard
            label="Trades"
            value={formatNumber(summary.kpis.trades, 0)}
            caption={`Approved count · ${sample}`}
          />
          <StatCard
            label="Profit factor"
            value={formatNumber(summary.kpis.profitFactor, 2)}
            caption="Approved summary"
          />
          <StatCard
            label="Sample"
            value={sample}
            caption="Historical window only"
          />
        </section>

        <div className="mt-4 rounded-md bg-disclaimer-bg px-4 py-3 text-xs leading-5 text-ink-muted">
          Portfolio KPIs above are locked approved summary figures. They are
          still a historical backtest, not a live track record. Do not market
          the full-sample CAGR as 20%.
        </div>

        <div className="mt-8 grid gap-4">
          <BacktestChart
            title="Equity curve"
            yLabel={`Account equity (${summary.currency})`}
            caption={
              reconstructed
                ? `${equity.note} Source: scaffold-until-fxday-export.`
                : equity.note
            }
            kind="equity"
            points={equity.points.map((point) => ({
              date: point.date,
              value: point.equity,
            }))}
          />
          <BacktestChart
            title="Drawdown"
            yLabel="Drawdown from running peak (%)"
            caption="Computed from the equity series. The approved max drawdown is −21%."
            kind="drawdown"
            points={equity.drawdown.map((point) => ({
              date: point.date,
              value: point.drawdownPct,
            }))}
          />
        </div>

        <div className="mt-8">
          <BacktestMarkets markets={markets} />
        </div>

        <div className="mt-8">
          <BacktestRules />
        </div>

        {years ? (
          <div className="mt-8">
            <BacktestYears years={years} />
          </div>
        ) : null}

        <div className="mt-8">
          <BacktestTrades
            trades={trades.trades}
            currency={trades.currency}
          />
        </div>

        <div className="mt-8">
          <PerformanceNote />
        </div>
      </Container>
    </div>
  );
}
