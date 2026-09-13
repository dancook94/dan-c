import { formatMoney, formatNumber } from "@/lib/format";
import type { ResultsCurrency, Trade } from "@/lib/results";

export function TradeLog({
  trades,
  currency,
}: {
  trades: Trade[];
  currency: ResultsCurrency;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-ink">Trade log</h2>
        <p className="text-xs text-ink-muted">Coming soon</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-bg text-xs tracking-wide text-ink-muted uppercase">
            <tr>
              <th className="px-5 py-3 font-medium">Closed</th>
              <th className="px-5 py-3 font-medium">ID</th>
              <th className="px-5 py-3 font-medium">Symbol</th>
              <th className="px-5 py-3 font-medium">Side</th>
              <th className="px-5 py-3 font-medium">P&amp;L</th>
              <th className="px-5 py-3 font-medium">R</th>
            </tr>
          </thead>
          <tbody>
            {trades.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-10 text-center text-ink-muted"
                >
                  No trades published. Individual fills will appear here from the
                  Python export — never invented for the marketing site.
                </td>
              </tr>
            ) : (
              trades.map((trade) => {
                const negative = trade.pnl < 0;
                return (
                  <tr key={trade.id} className="border-t border-border">
                    <td className="px-5 py-3 text-ink-muted">
                      {new Intl.DateTimeFormat("en-GB", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Europe/London",
                      }).format(new Date(trade.closedAt))}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs">{trade.id}</td>
                    <td className="px-5 py-3">{trade.symbol}</td>
                    <td className="px-5 py-3 capitalize">{trade.side}</td>
                    <td
                      className={`px-5 py-3 tabular-nums ${
                        negative
                          ? "bg-negative-soft text-negative"
                          : "bg-positive-soft text-positive"
                      }`}
                    >
                      {formatMoney(trade.pnl, currency)}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs tabular-nums">
                      {formatNumber(trade.rMultiple, 2)}
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
