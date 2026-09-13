import Link from "next/link";
import { Container } from "@/components/container";
import { LineChart } from "@/components/line-chart";
import { StatCard } from "@/components/stat-card";
import { formatNumber, formatPercent } from "@/lib/format";
import { loadResults } from "@/lib/results";

export default async function HomePage() {
  const results = await loadResults();
  const comingSoon = results.status !== "live";

  return (
    <div className="pb-16">
      <Container className="pt-12 pb-10 sm:pt-16 lg:pt-20">
        <h1 className="max-w-4xl text-[2rem] leading-[1.15] font-semibold tracking-tight text-ink sm:text-[2.5rem] lg:text-[3.15rem]">
          A systematic forex day-trading system — with a public track record.
        </h1>
        <p className="mt-5 max-w-2xl text-base text-ink-muted sm:text-lg">
          A rules-based forex day-trading method developed by a UK professional
          trader. Live results, detailed methodology, and transparent
          performance tracking.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/results"
            className="inline-flex h-12 items-center justify-center rounded-md bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            View live results →
          </Link>
          <Link
            href="/course"
            className="inline-flex h-12 items-center justify-center rounded-md px-2 text-sm font-semibold text-accent hover:text-accent-hover"
          >
            Join the course waitlist →
          </Link>
        </div>
        <p className="mt-5 max-w-2xl text-sm text-ink-muted">
          Historical H4 Donchian research lives on{" "}
          <Link
            href="/backtesting"
            className="font-medium text-accent hover:text-accent-hover"
          >
            Backtesting
          </Link>
          . That page is a hypothetical backtest, not the live book.
        </p>

        <section
          aria-label="Performance snapshot"
          className="mt-12 grid gap-4 lg:grid-cols-2"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Win rate"
              value={formatPercent(results.kpis.winRate)}
              caption={comingSoon ? "Coming soon" : "All time"}
            />
            <StatCard
              label="Profit factor"
              value={formatNumber(results.kpis.profitFactor, 3)}
              caption={comingSoon ? "Coming soon" : "All time"}
            />
            <StatCard
              label="Max drawdown"
              value={formatPercent(results.kpis.maxDrawdown)}
              caption={comingSoon ? "Coming soon" : "All time"}
              tone="negative"
            />
          </div>
          <LineChart
            title="Equity curve"
            yLabel="Account equity"
            caption={
              comingSoon
                ? "Placeholder only — no illustrative numbers"
                : "Live trading track record"
            }
            emptyLabel="Coming soon"
            points={results.equityCurve.map((point) => ({
              date: point.date,
              value: point.equity,
            }))}
          />
        </section>
      </Container>
    </div>
  );
}
