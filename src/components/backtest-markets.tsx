import type { BacktestMarkets } from "@/lib/backtesting-data";
import { formatMoney, formatNumber, formatPercent } from "@/lib/format";

function pendingOr<T>(
  value: T | null | undefined,
  format: (value: T) => string,
) {
  if (value === null || value === undefined) return "Pending export";
  return format(value);
}

export function BacktestMarkets({ markets }: { markets: BacktestMarkets }) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-ink">Per-market breakdown</h2>
        <p className="mt-1 text-xs text-ink-muted">{markets.note}</p>
      </div>
      <div className="grid gap-3 p-4 sm:hidden">
        {markets.markets.map((row) => (
          <article
            key={row.symbol}
            className="rounded-md border border-border bg-bg px-4 py-3"
          >
            <p className="text-sm font-semibold text-ink">{row.label}</p>
            <p className="font-mono text-xs text-ink-muted">{row.symbol}</p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-xs text-ink-muted">Trades</dt>
                <dd className="tabular-nums">
                  {pendingOr(row.trades, (n) => formatNumber(n, 0))}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Win rate</dt>
                <dd className="tabular-nums">
                  {pendingOr(row.winRate, (n) => formatPercent(n))}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">P&amp;L</dt>
                <dd className="tabular-nums">
                  {pendingOr(row.pnl, (n) => formatMoney(n, markets.currency))}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">% of profits</dt>
                <dd className="tabular-nums">
                  {pendingOr(row.shareOfProfits, (n) =>
                    formatPercent(n * 100, 0),
                  )}
                </dd>
              </div>
            </dl>
            {row.note ? (
              <p className="mt-2 text-xs leading-5 text-ink-muted">{row.note}</p>
            ) : null}
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto sm:block">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-bg text-xs tracking-wide text-ink-muted uppercase">
            <tr>
              <th className="px-5 py-3 font-medium">Market</th>
              <th className="px-5 py-3 font-medium">Trades</th>
              <th className="px-5 py-3 font-medium">Win rate</th>
              <th className="px-5 py-3 font-medium">P&amp;L</th>
              <th className="px-5 py-3 font-medium">% of profits</th>
            </tr>
          </thead>
          <tbody>
            {markets.markets.map((row) => (
              <tr key={row.symbol} className="border-t border-border">
                <td className="px-5 py-3">
                  <p className="font-medium text-ink">{row.label}</p>
                  <p className="font-mono text-xs text-ink-muted">{row.symbol}</p>
                </td>
                <td className="px-5 py-3 tabular-nums text-ink-muted">
                  {pendingOr(row.trades, (n) => formatNumber(n, 0))}
                </td>
                <td className="px-5 py-3 tabular-nums text-ink-muted">
                  {pendingOr(row.winRate, (n) => formatPercent(n))}
                </td>
                <td className="px-5 py-3 tabular-nums text-ink-muted">
                  {pendingOr(row.pnl, (n) => formatMoney(n, markets.currency))}
                </td>
                <td className="px-5 py-3 tabular-nums">
                  {row.shareOfProfits === null || row.shareOfProfits === undefined
                    ? "Pending export"
                    : formatPercent(row.shareOfProfits * 100, 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
