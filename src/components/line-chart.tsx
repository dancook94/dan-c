type Point = {
  date: string;
  value: number;
};

export function LineChart({
  title,
  caption,
  points,
  emptyLabel = "Coming soon",
  yLabel,
  stroke = "var(--dc-accent)",
}: {
  title: string;
  caption: string;
  points: Point[];
  emptyLabel?: string;
  yLabel?: string;
  stroke?: string;
}) {
  const width = 720;
  const height = 260;
  const pad = { top: 16, right: 16, bottom: 28, left: 44 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const hasData = points.length >= 2;
  const values = points.map((point) => point.value);
  const min = hasData ? Math.min(...values) : 0;
  const max = hasData ? Math.max(...values) : 1;
  const span = max - min || 1;

  const polyline = hasData
    ? points
        .map((point, index) => {
          const x = pad.left + (index / (points.length - 1)) * innerW;
          const y = pad.top + (1 - (point.value - min) / span) * innerH;
          return `${x},${y}`;
        })
        .join(" ")
    : "";

  const ticks = 4;

  return (
    <figure className="rounded-lg border border-border bg-surface p-5 shadow-card">
      <figcaption className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          {yLabel ? (
            <p className="text-xs text-ink-muted">{yLabel}</p>
          ) : null}
        </div>
        <p className="text-xs text-ink-muted">{caption}</p>
      </figcaption>
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full"
          role="img"
          aria-label={hasData ? title : `${title} — ${emptyLabel}`}
        >
          {Array.from({ length: ticks + 1 }, (_, index) => {
            const y = pad.top + (index / ticks) * innerH;
            return (
              <line
                key={y}
                x1={pad.left}
                x2={width - pad.right}
                y1={y}
                y2={y}
                stroke="var(--dc-border)"
                strokeWidth="1"
              />
            );
          })}
          {hasData ? (
            <polyline
              fill="none"
              stroke={stroke}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={polyline}
            />
          ) : null}
        </svg>
        {!hasData ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="rounded-pill bg-bg/90 px-3 py-1 text-sm font-medium text-ink-muted">
              {emptyLabel}
            </p>
          </div>
        ) : null}
      </div>
    </figure>
  );
}
