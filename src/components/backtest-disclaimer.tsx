import Link from "next/link";
import type { BacktestCaveat } from "@/lib/backtesting-data";

export function BacktestDisclaimer({
  caveats,
}: {
  caveats: BacktestCaveat[];
}) {
  return (
    <aside
      aria-label="Backtest disclaimer"
      className="overflow-hidden rounded-lg border border-border bg-disclaimer-bg"
    >
      <div className="border-l-4 border-l-negative px-5 py-4 sm:px-6 sm:py-5">
        <p className="text-sm font-semibold tracking-tight text-ink">
          Historical backtest — hypothetical, not a live track record
        </p>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          These figures are a historical, hypothetical reconstruction of the
          approved multi-market H4 Donchian trend book. They are not financial
          advice, not a recommendation, and not the paper or live book. Live
          and paper placeholders stay on{" "}
          <Link
            href="/results"
            className="font-medium text-accent hover:text-accent-hover"
          >
            Results
          </Link>
          .
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-ink">
          {caveats.map((caveat) => (
            <li key={caveat.id}>{caveat.text}</li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
