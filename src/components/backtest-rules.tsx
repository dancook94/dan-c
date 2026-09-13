export function BacktestRules() {
  return (
    <section className="rounded-lg border border-border bg-surface p-5 shadow-card sm:p-6">
      <h2 className="text-lg font-semibold tracking-tight text-ink">Rules</h2>
      <p className="mt-2 text-sm leading-6 text-ink-muted">
        The approved book is a multi-market H4 Donchian trend system. These are
        the written rules. They are research specification, not a signal feed
        and not an invitation to copy-trade.
      </p>
      <dl className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <dt className="text-sm font-semibold text-ink">Donchian 20/10 on H4</dt>
          <dd className="mt-1 text-sm leading-6 text-ink-muted">
            Four-hour bars. Entry channel is a 20-bar Donchian breakout. The
            trailing stop uses a 10-bar Donchian. Same parameters on US30,
            NAS100, XAUUSD, and DE40.
          </dd>
        </div>
        <div>
          <dt className="text-sm font-semibold text-ink">SMA200 filter</dt>
          <dd className="mt-1 text-sm leading-6 text-ink-muted">
            Trade with the 200-period simple moving average on H4. Longs only
            above; shorts only below. Counter-trend breakouts are ignored.
          </dd>
        </div>
        <div>
          <dt className="text-sm font-semibold text-ink">1% risk per trade</dt>
          <dd className="mt-1 text-sm leading-6 text-ink-muted">
            Position size is set so that a stop-out costs about 1% of account
            equity at entry. Size is not increased to recover a loss.
          </dd>
        </div>
        <div>
          <dt className="text-sm font-semibold text-ink">Max 3 positions</dt>
          <dd className="mt-1 text-sm leading-6 text-ink-muted">
            At most three open trades across the book. A fourth signal waits.
            Correlated index longs still count as separate slots.
          </dd>
        </div>
        <div>
          <dt className="text-sm font-semibold text-ink">Chandelier exit</dt>
          <dd className="mt-1 text-sm leading-6 text-ink-muted">
            Once in profit, the book trails with a Chandelier (ATR-based) exit
            in addition to the 10-bar Donchian. The tighter of the two is the
            working stop.
          </dd>
        </div>
        <div>
          <dt className="text-sm font-semibold text-ink">Costs model</dt>
          <dd className="mt-1 text-sm leading-6 text-ink-muted">
            Headline KPIs are treated as net of the original research costs
            model — typical spread, commission, and overnight financing where
            an H4 hold spans sessions. Exact per-market cost tables are not
            published here. They will land with the fxday / Trading Ted export.
            This is not a live fill-by-fill audit, and slippage is not
            reconstructed trade-by-trade.
          </dd>
        </div>
      </dl>
    </section>
  );
}
