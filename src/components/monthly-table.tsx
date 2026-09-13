import { formatMoney, formatMonth, formatNumber, formatPercent } from "@/lib/format";
import type { MonthlyReturn, ResultsCurrency } from "@/lib/results";

export function MonthlyTable({
  rows,
  currency,
}: {
  rows: MonthlyReturn[];
  currency: ResultsCurrency;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-ink">Monthly returns</h2>
        <p className="text-xs text-ink-muted">Coming soon</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-bg text-xs tracking-wide text-ink-muted uppercase">
            <tr>
              <th className="px-5 py-3 font-medium">Month</th>
              <th className="px-5 py-3 font-medium">Net P&amp;L</th>
              <th className="px-5 py-3 font-medium">Return</th>
              <th className="px-5 py-3 font-medium">Win rate</th>
              <th className="px-5 py-3 font-medium">Trades</th>
              <th className="px-5 py-3 font-medium">Profit factor</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-10 text-center text-ink-muted"
                >
                  No monthly figures yet. This table fills from{" "}
                  <code className="font-mono text-xs">data/results.json</code>{" "}
                  when the live book is published.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const negative = row.netPnl < 0;
                return (
                  <tr key={row.month} className="border-t border-border">
                    <td className="px-5 py-3 text-ink">{formatMonth(row.month)}</td>
                    <td
                      className={`px-5 py-3 tabular-nums ${
                        negative
                          ? "bg-negative-soft text-negative"
                          : "bg-positive-soft text-positive"
                      }`}
                    >
                      {formatMoney(row.netPnl, currency)}
                    </td>
                    <td
                      className={`px-5 py-3 tabular-nums ${
                        negative ? "text-negative" : "text-positive"
                      }`}
                    >
                      {formatPercent(row.returnPct)}
                    </td>
                    <td className="px-5 py-3 tabular-nums">
                      {formatPercent(row.winRate)}
                    </td>
                    <td className="px-5 py-3 tabular-nums">
                      {formatNumber(row.trades, 0)}
                    </td>
                    <td className="px-5 py-3 tabular-nums">
                      {formatNumber(row.profitFactor, 3)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
