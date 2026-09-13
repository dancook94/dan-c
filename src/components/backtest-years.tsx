import type { BacktestYears } from "@/lib/backtesting-data";
import { formatNumber, formatPercent } from "@/lib/format";

export function BacktestYears({ years }: { years: BacktestYears }) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-ink">Yearly returns</h2>
        <p className="mt-1 text-xs text-ink-muted">{years.note}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-bg text-xs tracking-wide text-ink-muted uppercase">
            <tr>
              <th className="px-5 py-3 font-medium">Year</th>
              <th className="px-5 py-3 font-medium">Return</th>
              <th className="px-5 py-3 font-medium">Trades</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {years.years.map((row) => {
              const returnPct = row.returnPct;
              const pending = returnPct === null || returnPct === undefined;
              const negative = returnPct !== null && returnPct !== undefined && returnPct < 0;
              return (
                <tr key={row.year} className="border-t border-border">
                  <td className="px-5 py-3 text-ink">
                    {row.year}
                    {row.partial ? (
                      <span className="ml-2 text-xs text-ink-muted">YTD</span>
                    ) : null}
                  </td>
                  <td
                    className={`px-5 py-3 tabular-nums ${
                      pending
                        ? "text-ink-muted"
                        : negative
                          ? "bg-negative-soft text-negative"
                          : "bg-positive-soft text-positive"
                    }`}
                  >
                    {pending ? "Pending export" : formatPercent(returnPct)}
                  </td>
                  <td className="px-5 py-3 tabular-nums text-ink-muted">
                    {row.trades === null || row.trades === undefined
                      ? "Pending export"
                      : formatNumber(row.trades, 0)}
                  </td>
                  <td className="px-5 py-3 text-ink-muted">
                    {row.status === "approved_caveat"
                      ? "Approved caveat"
                      : row.status === "exported"
                        ? "Exported"
                        : "Pending export"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
