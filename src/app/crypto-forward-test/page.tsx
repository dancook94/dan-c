import type { Metadata } from "next";
import Link from "next/link";
import { CryptoForwardChart } from "@/components/crypto-forward-chart";
import {
  CryptoForwardTrades,
  type CryptoForwardTradeRow,
} from "@/components/crypto-forward-trades";
import { Container } from "@/components/container";
import { Disclaimer, PerformanceNote } from "@/components/disclaimer";
import { StatCard } from "@/components/stat-card";
import {
  CRYPTO_FORWARD_BACKTEST,
  CRYPTO_FORWARD_COST_PCT,
  CRYPTO_FORWARD_EMPTY_MESSAGE,
  CRYPTO_FORWARD_LABEL,
  CRYPTO_FORWARD_REVIEW_DATE,
  CRYPTO_FORWARD_STARTING_NOTIONAL,
  CRYPTO_FORWARD_START_DATE,
} from "@/lib/crypto-forward";
import { loadCryptoForwardBook } from "@/lib/crypto-forward-store";
import {
  formatCryptoQty,
  formatNumber,
  formatPercent,
  formatSignedPercent,
  formatUsdt,
} from "@/lib/format";

export const metadata: Metadata = {
  title: "Crypto forward test",
  description:
    "Paper forward test of a BTC and ETH daily trend rule. No real orders. Priced in USDT. Not financial advice.",
};

export const revalidate = 300;

function formatDay(iso: string) {
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

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

function formatWeight(weightPct: number) {
  const digits = Number.isInteger(weightPct) ? 0 : 1;
  return formatPercent(weightPct, digits);
}

export default async function CryptoForwardTestPage() {
  const loaded = await loadCryptoForwardBook();
  const book = loaded.status === "ready" ? loaded.book : null;
  const primary = book?.lines[0] ?? null;
  const names = new Map<string, string>();
  if (book) {
    for (const series of [...book.lines, ...book.benchmarks]) {
      names.set(series.id, series.name);
    }
  }

  const tradeRows: CryptoForwardTradeRow[] = book
    ? book.trades.map((trade) => ({
        ...trade,
        lineName: names.get(trade.line) ?? trade.line,
      }))
    : [];

  const filters = book
    ? [
        { id: "all", label: "All" },
        ...[...book.lines, ...book.benchmarks].map((series) => ({
          id: series.id,
          label: series.name,
        })),
      ]
    : [];

  const startLabel = formatDay(book?.startDate ?? CRYPTO_FORWARD_START_DATE);
  const reviewLabel = formatDay(book?.reviewDate ?? CRYPTO_FORWARD_REVIEW_DATE);
  const awaiting = loaded.status !== "ready";

  return (
    <div className="pb-16">
      <Container className="pt-10 pb-6 sm:pt-14">
        <p className="text-sm font-medium text-accent">{CRYPTO_FORWARD_LABEL}</p>
        <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Crypto forward test
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-ink-muted">
          A six-month paper test of a daily trend rule on Bitcoin and Ethereum.
          Each coin is half of a {formatUsdt(CRYPTO_FORWARD_STARTING_NOTIONAL, 0)}{" "}
          notional book and is held only while its daily close is above a moving
          average. The test started at the {startLabel} daily close, the first
          fills are at the next daily open, and the review is {reviewLabel}. It
          keeps running after that review unless it is stopped. Marks are in
          USDT, not pounds, and every fill costs {CRYPTO_FORWARD_COST_PCT}%.
        </p>
        <p className="mt-3 max-w-3xl text-lg text-ink-muted">
          This is not the forex demo on{" "}
          <Link
            href="/forward-test"
            className="font-medium text-accent hover:text-accent-hover"
          >
            Forward test
          </Link>
          .
        </p>

        <div className="mt-6">
          <Disclaimer />
        </div>

        <section
          aria-label="Paper trading notice"
          className="mt-6 rounded-lg border border-border bg-surface px-5 py-5 shadow-card sm:px-6"
        >
          <p className="text-xs font-semibold tracking-wide text-negative uppercase">
            {CRYPTO_FORWARD_LABEL}
          </p>
          <p className="mt-3 text-sm leading-6 text-ink">
            These figures are a <strong className="font-semibold">paper</strong>{" "}
            forward test. No real orders are sent, there is no exchange account,
            and this is not a funded track record.
          </p>
          {loaded.status === "unavailable" ? (
            <p className="mt-3 text-sm leading-6 text-ink">
              The crypto forward feed is temporarily unavailable. This page
              retries about every five minutes.
            </p>
          ) : null}
          {loaded.storage === "unconfigured" ? (
            <p className="mt-3 text-sm leading-6 text-ink-muted">
              Blob storage is not connected yet. On Vercel, connect the existing
              Blob store so <code className="font-mono text-xs">BLOB_READ_WRITE_TOKEN</code>{" "}
              is set. Snapshots are written to{" "}
              <code className="font-mono text-xs">crypto-forward/book.json</code>.
            </p>
          ) : null}
          {loaded.status === "empty" ? (
            <p className="mt-3 text-sm font-medium text-ink">
              {CRYPTO_FORWARD_EMPTY_MESSAGE}
            </p>
          ) : null}
          {book ? (
            <p className="mt-3 text-sm leading-6 text-ink-muted">
              Last snapshot {formatStamp(book.updatedAt)}. Equity is the daily
              close mark and does not charge an exit cost until a fill happens.
            </p>
          ) : null}
        </section>

        <section
          aria-label="Crypto forward-test headline statistics"
          className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <StatCard
            label="Start date"
            value={startLabel}
            caption="Signal at the daily close"
          />
          <StatCard
            label="Review date"
            value={reviewLabel}
            caption="Then it keeps running"
          />
          <StatCard
            label="Notional"
            value={formatUsdt(CRYPTO_FORWARD_STARTING_NOTIONAL, 0)}
            caption="50/50 BTC and ETH, priced in USDT"
          />
          <StatCard
            label="Primary equity"
            value={formatUsdt(primary?.equity)}
            caption={primary ? primary.name : "Waiting for the daily snapshot"}
          />
          <StatCard
            label="Return"
            value={formatSignedPercent(primary?.returnPct ?? null, 1)}
            caption={primary ? "From the 5,000 USDT start" : "No snapshot yet"}
            tone={
              primary !== null && primary.returnPct < 0 ? "negative" : "default"
            }
          />
          <StatCard
            label="Max drawdown"
            value={formatPercent(primary?.maxDDPct ?? null, 1)}
            caption="Peak to trough, primary book"
            tone={primary !== null && primary.maxDDPct < 0 ? "negative" : "default"}
          />
          <StatCard
            label="Fills"
            value={book ? formatNumber(book.trades.length, 0) : "—"}
            caption={
              book ? "Lines and benchmarks, paper only" : "No snapshot yet"
            }
          />
          <StatCard
            label="Updated"
            value={book ? formatStamp(book.updatedAt) : "—"}
            caption={book ? "Daily job" : "Waiting for the daily snapshot"}
          />
        </section>

        <section className="mt-10" aria-label="What is being tested">
          <h2 className="text-xl font-semibold text-ink">The books</h2>
          <p className="mt-2 max-w-3xl text-sm text-ink-muted">
            Three paper lines share the same 5,000 USDT start and the same
            0.15% cost per fill. Two benchmarks sit beside them. None of these
            is a live order.
          </p>
          <ul className="mt-4 max-w-3xl list-disc space-y-2 pl-5 text-sm leading-6 text-ink">
            <li>
              Primary: BTC and ETH, half the capital each, held while the daily
              close is above that coin&apos;s 100-day simple moving average.
            </li>
            <li>Shadow: the same split, using a 150-day average.</li>
            <li>
              Shadow: the 100-day rule, with each sleeve sized to a 40%
              volatility target.
            </li>
            <li>Benchmark: 50/50 BTC and ETH, bought and held.</li>
            <li>
              Benchmark: the S&amp;P 500 price index, rebased to the same
              5,000 start. No dividends.
            </li>
          </ul>
        </section>

        <section className="mt-10" aria-label="Line and benchmark results">
          <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold text-ink">
                Lines and benchmarks
              </h2>
              <p className="mt-1 text-xs text-ink-muted">
                Figures posted by the daily paper book
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-bg text-xs tracking-wide text-ink-muted uppercase">
                  <tr>
                    <th className="px-5 py-3 font-medium">Book</th>
                    <th className="px-5 py-3 font-medium">Role</th>
                    <th className="px-5 py-3 font-medium">Equity</th>
                    <th className="px-5 py-3 font-medium">Return</th>
                    <th className="px-5 py-3 font-medium">Max drawdown</th>
                  </tr>
                </thead>
                <tbody>
                  {book === null ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-10 text-center text-ink-muted"
                      >
                        {CRYPTO_FORWARD_EMPTY_MESSAGE}
                      </td>
                    </tr>
                  ) : (
                    [...book.lines, ...book.benchmarks].map((series, index) => (
                      <tr
                        key={series.id}
                        className="border-t border-border"
                      >
                        <td className="px-5 py-3 text-ink">{series.name}</td>
                        <td className="px-5 py-3 text-ink-muted">
                          {index < book.lines.length ? "Line" : "Benchmark"}
                        </td>
                        <td className="px-5 py-3 tabular-nums">
                          {formatUsdt(series.equity)}
                        </td>
                        <td
                          className={`px-5 py-3 tabular-nums ${
                            series.returnPct < 0 ? "text-negative" : "text-ink"
                          }`}
                        >
                          {formatSignedPercent(series.returnPct, 1)}
                        </td>
                        <td className="px-5 py-3 tabular-nums">
                          {formatPercent(series.maxDDPct, 1)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <div className="mt-6">
          <CryptoForwardChart
            series={
              book
                ? [
                    ...book.lines.map((series) => ({
                      id: series.id,
                      name: series.name,
                      benchmark: false,
                      points: series.equityCurve,
                    })),
                    ...book.benchmarks.map((series) => ({
                      id: series.id,
                      name: series.name,
                      benchmark: true,
                      points: series.equityCurve,
                    })),
                  ]
                : []
            }
            emptyLabel={CRYPTO_FORWARD_EMPTY_MESSAGE}
            caption={
              book
                ? "Solid lines are the paper books. Dashed lines are benchmarks. The S&P 500 line is the price index, without dividends, and it is not converted into pounds."
                : "The curves appear when the daily job posts the first snapshot."
            }
          />
        </div>

        <section className="mt-10" aria-label="Current positions">
          <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold text-ink">Current positions</h2>
              <p className="mt-1 text-xs text-ink-muted">
                After the last posted snapshot. Weight is the share of that
                coin&apos;s sleeve.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-bg text-xs tracking-wide text-ink-muted uppercase">
                  <tr>
                    <th className="px-5 py-3 font-medium">Book</th>
                    <th className="px-5 py-3 font-medium">Holdings</th>
                    <th className="px-5 py-3 font-medium">Cash</th>
                  </tr>
                </thead>
                <tbody>
                  {book === null ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-5 py-10 text-center text-ink-muted"
                      >
                        {CRYPTO_FORWARD_EMPTY_MESSAGE}
                      </td>
                    </tr>
                  ) : (
                    [...book.lines, ...book.benchmarks].map((series) => (
                      <tr key={series.id} className="border-t border-border">
                        <td className="px-5 py-3 text-ink">{series.name}</td>
                        <td className="px-5 py-3">
                          {series.positions.length === 0 ? (
                            <span className="text-ink-muted">
                              No open coin position
                            </span>
                          ) : (
                            <ul className="space-y-1">
                              {series.positions.map((position) => (
                                <li key={position.symbol} className="tabular-nums">
                                  <span className="font-mono text-xs">
                                    {position.symbol}
                                  </span>{" "}
                                  {formatCryptoQty(position.qty)}
                                  <span className="text-ink-muted">
                                    {" "}
                                    · {formatWeight(position.weightPct)} of sleeve
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                        <td className="px-5 py-3 tabular-nums whitespace-nowrap">
                          {formatUsdt(series.cash)}
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
          <CryptoForwardTrades
            trades={tradeRows}
            filters={filters}
            emptyMessage={
              awaiting ? CRYPTO_FORWARD_EMPTY_MESSAGE : "No fills in this snapshot."
            }
          />
        </div>

        <section className="mt-10" aria-label="Caveats">
          <h2 className="text-xl font-semibold text-ink">
            What this page cannot tell you
          </h2>
          <ul className="mt-4 max-w-3xl list-disc space-y-2 pl-5 text-sm leading-6 text-ink-muted">
            <li>
              Paper only. Nothing here is a live fill, a client account, or an
              exchange order.
            </li>
            <li>
              The rule trades about {CRYPTO_FORWARD_BACKTEST.tradesPerYear} times
              a year, so six months can show a broken feed or a bad fill. It
              cannot prove an edge.
            </li>
            <li>Prices are in USDT. They are not converted into pounds.</li>
            <li>
              The S&amp;P 500 line is the price index. Dividends are not included.
            </li>
            <li>
              The research backtest of this idea compounded at about{" "}
              {formatPercent(CRYPTO_FORWARD_BACKTEST.annualReturnPct, 1)} a year,
              with a drawdown of{" "}
              {formatSignedPercent(CRYPTO_FORWARD_BACKTEST.maxDrawdownPct, 0)}.
              That result depended heavily on a few big winners. This forward
              test is not that backtest.
            </li>
          </ul>
        </section>

        <div className="mt-6">
          <PerformanceNote />
        </div>
      </Container>
    </div>
  );
}
