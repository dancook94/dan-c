import {
  BACKTEST_SUMMARY,
  type BacktestTrade,
  type EquityPoint,
} from "./backtesting.ts";

export const FORWARD_TEST_MARKETS = ["US30", "NAS100", "XAUUSD", "DE40"] as const;

export type ForwardMarket = (typeof FORWARD_TEST_MARKETS)[number];

export type ForwardEventType = "open" | "close" | "equity";

export type ForwardSide = "long" | "short";

/** Shown until the EA posts an open or an equity snapshot. */
export const FORWARD_TEST_PENDING_START_LABEL = "Starting October 2026";

export const FORWARD_TEST_STARTING_EQUITY = BACKTEST_SUMMARY.startingEquity;

const SAMPLE_ID_PREFIX = "SAMPLE-FT";

export const FORWARD_TEST_EMPTY_MESSAGE =
  "Forward test starting October 2026 — no trades yet";

export const FORWARD_TEST_LABEL = "Demo account, forward test, not live money";

export const MAX_FORWARD_TEST_EVENTS = 10_000;

/** Research-book expectations shown beside the demo figures. */
export const FORWARD_TEST_EXPECTATIONS = {
  winRatePct: 40,
  profitFactor: BACKTEST_SUMMARY.profitFactor,
  avgTradesPerMonth: 9,
  cagrPct: BACKTEST_SUMMARY.cagrPct,
  maxDrawdownPct: BACKTEST_SUMMARY.maxDrawdownPct,
  trades: BACKTEST_SUMMARY.trades,
  periodLabel: "2016–2026",
  href: "/backtesting",
} as const;

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const MIN_TIME_MS = Date.parse("2016-01-01T00:00:00.000Z");
const MAX_TIME_MS = Date.parse("2100-01-01T00:00:00.000Z");
const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30.4375;

export type ForwardTestEvent = {
  type: ForwardEventType;
  id: string;
  market: ForwardMarket | null;
  symbol: string | null;
  side: ForwardSide | null;
  openedAt: string | null;
  entry: number | null;
  stop: number | null;
  lots: number | null;
  riskPct: number | null;
  closedAt: string | null;
  exit: number | null;
  reason: string | null;
  pnl: number | null;
  rMultiple: number | null;
  equity: number | null;
  balance: number | null;
  at: string | null;
  receivedAt: string;
};

export type ForwardTestBook = {
  schemaVersion: 1;
  events: ForwardTestEvent[];
};

export type ForwardOpenPosition = {
  id: string;
  market: ForwardMarket;
  symbol: string | null;
  side: ForwardSide;
  openedAt: string;
  entry: number;
  stop: number;
  lots: number;
  riskPct: number;
};

export type ForwardTestStorage = "blob" | "local" | "unconfigured";

export type ForwardTestSummary = {
  schemaVersion: 1;
  status: "empty" | "active" | "unavailable";
  storage: ForwardTestStorage;
  label: typeof FORWARD_TEST_LABEL;
  currency: "GBP";
  account: "Pepperstone UK MT5 demo";
  book: string;
  markets: readonly ForwardMarket[];
  startDate: string | null;
  startLabel: string;
  startingEquity: number;
  currentEquity: number | null;
  balance: number | null;
  equitySource: "snapshot" | "reconstructed" | "none";
  equityAsOf: string | null;
  returnPct: number | null;
  maxDrawdownPct: number | null;
  maxDrawdownAt: string | null;
  tradesClosed: number;
  tradesOpen: number;
  wins: number;
  winRatePct: number | null;
  avgR: number | null;
  profitFactor: number | null;
  tradesPerMonth: number | null;
  updatedAt: string | null;
  emptyMessage: typeof FORWARD_TEST_EMPTY_MESSAGE | null;
  expectations: typeof FORWARD_TEST_EXPECTATIONS;
  equityCurve: EquityPoint[];
  openPositions: ForwardOpenPosition[];
  closedTrades: BacktestTrade[];
};

export class ForwardTestCapacityError extends Error {
  constructor() {
    super("The forward-test store has reached its event limit.");
    this.name = "ForwardTestCapacityError";
  }
}

export function emptyForwardTestBook(): ForwardTestBook {
  return { schemaVersion: 1, events: [] };
}

/** Local test ids. These must not be stored on Vercel. */
export function isSampleForwardTestId(id: string): boolean {
  return id.toUpperCase().startsWith(SAMPLE_ID_PREFIX);
}

export function omitSampleForwardTestEvents(
  events: ForwardTestEvent[],
): ForwardTestEvent[] {
  return events.filter((event) => !isSampleForwardTestId(event.id));
}

/**
 * The demo starts at the earliest open or equity snapshot.
 * A close on its own does not set the start.
 */
export function earliestForwardTestStart(
  events: ForwardTestEvent[],
): string | null {
  let earliest: string | null = null;
  for (const event of events) {
    const stamp =
      event.type === "open"
        ? event.openedAt
        : event.type === "equity"
          ? event.at
          : null;
    if (!stamp) continue;
    if (!earliest || stamp < earliest) earliest = stamp;
  }
  return earliest;
}

export function formatForwardTestStartLabel(instant: string | null): string {
  if (!instant) return FORWARD_TEST_PENDING_START_LABEL;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(instant));
}

type ParseSuccess = {
  ok: true;
  event: Omit<ForwardTestEvent, "receivedAt">;
};

type ParseFailure = { ok: false; error: string };

export function parseForwardTestEvent(input: unknown): ParseSuccess | ParseFailure {
  if (!isRecord(input)) {
    return { ok: false, error: "Body must be a JSON object." };
  }

  const type = parseType(input.type);
  if (!type) {
    return { ok: false, error: "type must be open, close, or equity." };
  }

  const id = parseId(input.id);
  if (!id) {
    return {
      ok: false,
      error: "id must be an MT5 ticket or a short id (letters, numbers, ., _, :, -).",
    };
  }

  const market = readMarket(input, "market");
  if (!market.ok) return market;
  const symbol = readString(input, "symbol", 64);
  if (!symbol.ok) return symbol;
  const side = readSide(input, "side");
  if (!side.ok) return side;
  const openedAt = readTime(input, "openedAt");
  if (!openedAt.ok) return openedAt;
  const entry = readNumber(input, "entry");
  if (!entry.ok) return entry;
  const stop = readNumber(input, "stop");
  if (!stop.ok) return stop;
  const lots = readNumber(input, "lots");
  if (!lots.ok) return lots;
  const riskPct = readNumber(input, "riskPct");
  if (!riskPct.ok) return riskPct;
  const closedAt = readTime(input, "closedAt");
  if (!closedAt.ok) return closedAt;
  const exit = readNumber(input, "exit");
  if (!exit.ok) return exit;
  const reason = readString(input, "reason", 500);
  if (!reason.ok) return reason;
  const pnl = readNumber(input, "pnl");
  if (!pnl.ok) return pnl;
  const rMultiple = readNumber(input, "rMultiple");
  if (!rMultiple.ok) return rMultiple;
  const equity = readNumber(input, "equity");
  if (!equity.ok) return equity;
  const balance = readNumber(input, "balance");
  if (!balance.ok) return balance;
  const at = readTime(input, "at");
  if (!at.ok) return at;

  const event: Omit<ForwardTestEvent, "receivedAt"> = {
    type,
    id,
    market: market.value,
    symbol: symbol.value,
    side: side.value,
    openedAt: openedAt.value,
    entry: entry.value,
    stop: stop.value,
    lots: lots.value,
    riskPct: riskPct.value,
    closedAt: closedAt.value,
    exit: exit.value,
    reason: reason.value,
    pnl: pnl.value,
    rMultiple: rMultiple.value,
    equity: equity.value,
    balance: balance.value,
    at: at.value,
  };

  const rangeError = validateRanges(event);
  if (rangeError) return { ok: false, error: rangeError };

  const requiredError = validateRequired(event);
  if (requiredError) return { ok: false, error: requiredError };

  return { ok: true, event };
}

export function applyForwardTestEvent(
  book: ForwardTestBook,
  event: ForwardTestEvent,
): { book: ForwardTestBook; created: boolean } {
  const index = book.events.findIndex(
    (item) => item.type === event.type && item.id === event.id,
  );
  if (index >= 0) {
    const events = book.events.slice();
    events[index] = event;
    return { book: { schemaVersion: 1, events }, created: false };
  }
  if (book.events.length >= MAX_FORWARD_TEST_EVENTS) {
    throw new ForwardTestCapacityError();
  }
  return {
    book: { schemaVersion: 1, events: [...book.events, event] },
    created: true,
  };
}

export function summarizeForwardTest(
  events: ForwardTestEvent[],
  options: {
    storage: ForwardTestStorage;
    now?: Date;
    unavailable?: boolean;
  },
): ForwardTestSummary {
  const base = summaryShell(options.storage);
  if (options.unavailable) {
    return { ...base, status: "unavailable" };
  }

  const opens = events.filter((event) => event.type === "open");
  const closes = events.filter((event) => event.type === "close");
  const snapshots = events
    .filter(
      (event): event is ForwardTestEvent & { equity: number; at: string } =>
        event.type === "equity" && event.equity !== null && event.at !== null,
    )
    .slice()
    .sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id));

  const closedIds = new Set(closes.map((event) => event.id));
  const openPositions = opens
    .filter(
      (event): event is ForwardTestEvent & {
        market: ForwardMarket;
        side: ForwardSide;
        openedAt: string;
        entry: number;
        stop: number;
        lots: number;
        riskPct: number;
      } =>
        !closedIds.has(event.id) &&
        event.market !== null &&
        event.side !== null &&
        event.openedAt !== null &&
        event.entry !== null &&
        event.stop !== null &&
        event.lots !== null &&
        event.riskPct !== null,
    )
    .slice()
    .sort((a, b) => b.openedAt.localeCompare(a.openedAt) || b.id.localeCompare(a.id))
    .map((event) => ({
      id: event.id,
      market: event.market,
      symbol: event.symbol,
      side: event.side,
      openedAt: event.openedAt,
      entry: event.entry,
      stop: event.stop,
      lots: event.lots,
      riskPct: event.riskPct,
    }));

  const closedTrades = closes
    .slice()
    .sort(
      (a, b) =>
        (b.closedAt ?? "").localeCompare(a.closedAt ?? "") || b.id.localeCompare(a.id),
    )
    .map(toBacktestTrade);

  const pricedCloses = closes.filter(
    (event): event is ForwardTestEvent & { pnl: number } => event.pnl !== null,
  );
  const wins = pricedCloses.filter((event) => event.pnl > 0).length;
  const winRatePct = pricedCloses.length
    ? (wins / pricedCloses.length) * 100
    : null;

  const rValues = closes
    .map((event) => event.rMultiple)
    .filter((value): value is number => value !== null && Number.isFinite(value));
  const avgR = rValues.length
    ? rValues.reduce((sum, value) => sum + value, 0) / rValues.length
    : null;

  let grossProfit = 0;
  let grossLoss = 0;
  for (const event of pricedCloses) {
    if (event.pnl > 0) grossProfit += event.pnl;
    else if (event.pnl < 0) grossLoss += event.pnl;
  }
  const profitFactor = grossLoss < 0 ? grossProfit / Math.abs(grossLoss) : null;

  const startInstant = earliestForwardTestStart(events);
  const curve = buildEquityCurve(snapshots, pricedCloses, startInstant);
  const currentEquity = curve.currentEquity;
  const returnPct =
    currentEquity === null
      ? null
      : ((currentEquity - FORWARD_TEST_STARTING_EQUITY) / FORWARD_TEST_STARTING_EQUITY) *
        100;

  const latestSnapshot = snapshots.at(-1);
  const now = options.now ?? new Date();
  const rateStart =
    startInstant ??
    pricedCloses
      .map((event) => event.closedAt)
      .filter((stamp): stamp is string => Boolean(stamp))
      .sort()[0] ??
    null;
  const tradesPerMonth =
    pricedCloses.length > 0 && rateStart
      ? tradesPerMonthSinceStart(pricedCloses.length, now, rateStart)
      : null;

  const updatedAt = events.reduce<string | null>((latest, event) => {
    if (!latest || event.receivedAt > latest) return event.receivedAt;
    return latest;
  }, null);

  const awaitingTrades = opens.length === 0 && closes.length === 0;

  return {
    ...base,
    status: events.length === 0 ? "empty" : "active",
    startDate: startInstant ? startInstant.slice(0, 10) : null,
    startLabel: formatForwardTestStartLabel(startInstant),
    currentEquity,
    balance: latestSnapshot?.balance ?? null,
    equitySource: curve.source,
    equityAsOf: curve.asOf,
    returnPct,
    maxDrawdownPct: curve.maxDrawdownPct,
    maxDrawdownAt: curve.maxDrawdownAt,
    tradesClosed: closes.length,
    tradesOpen: openPositions.length,
    wins,
    winRatePct,
    avgR,
    profitFactor,
    tradesPerMonth,
    updatedAt,
    emptyMessage: awaitingTrades ? FORWARD_TEST_EMPTY_MESSAGE : null,
    equityCurve: curve.points,
    openPositions,
    closedTrades,
  };
}

export function unavailableForwardTestSummary(
  storage: ForwardTestStorage,
): ForwardTestSummary {
  return summarizeForwardTest([], { storage, unavailable: true });
}

function summaryShell(storage: ForwardTestStorage): ForwardTestSummary {
  return {
    schemaVersion: 1,
    status: "empty",
    storage,
    label: FORWARD_TEST_LABEL,
    currency: "GBP",
    account: "Pepperstone UK MT5 demo",
    book: "H4 Donchian trend, long-only, 1% risk",
    markets: FORWARD_TEST_MARKETS,
    startDate: null,
    startLabel: FORWARD_TEST_PENDING_START_LABEL,
    startingEquity: FORWARD_TEST_STARTING_EQUITY,
    currentEquity: null,
    balance: null,
    equitySource: "none",
    equityAsOf: null,
    returnPct: null,
    maxDrawdownPct: null,
    maxDrawdownAt: null,
    tradesClosed: 0,
    tradesOpen: 0,
    wins: 0,
    winRatePct: null,
    avgR: null,
    profitFactor: null,
    tradesPerMonth: null,
    updatedAt: null,
    emptyMessage: FORWARD_TEST_EMPTY_MESSAGE,
    expectations: FORWARD_TEST_EXPECTATIONS,
    equityCurve: [],
    openPositions: [],
    closedTrades: [],
  };
}

function buildEquityCurve(
  snapshots: Array<ForwardTestEvent & { equity: number; at: string }>,
  closes: Array<ForwardTestEvent & { pnl: number }>,
  startInstant: string | null,
): {
  points: EquityPoint[];
  source: "snapshot" | "reconstructed" | "none";
  currentEquity: number | null;
  asOf: string | null;
  maxDrawdownPct: number | null;
  maxDrawdownAt: string | null;
} {
  if (snapshots.length > 0) {
    const raw: Array<{ date: string; equity: number }> = [];
    const first = snapshots[0];
    const anchor = startInstant ?? first.at;
    const sameInstant = first.at === anchor;
    if (!sameInstant || first.equity !== FORWARD_TEST_STARTING_EQUITY) {
      raw.push({ date: anchor, equity: FORWARD_TEST_STARTING_EQUITY });
    }
    for (const snapshot of snapshots) {
      raw.push({ date: snapshot.at, equity: snapshot.equity });
    }
    const points = withDrawdown(raw);
    const last = snapshots[snapshots.length - 1];
    const trough = worstDrawdown(points);
    return {
      points,
      source: "snapshot",
      currentEquity: last.equity,
      asOf: last.at,
      maxDrawdownPct: trough?.drawdownPct ?? 0,
      maxDrawdownAt: trough?.date ?? null,
    };
  }

  if (closes.length > 0) {
    const ordered = closes
      .slice()
      .sort(
        (a, b) =>
          (a.closedAt ?? a.receivedAt).localeCompare(b.closedAt ?? b.receivedAt) ||
          a.id.localeCompare(b.id),
      );
    let equity = FORWARD_TEST_STARTING_EQUITY;
    const firstClose = ordered[0];
    const anchor =
      startInstant ?? firstClose.closedAt ?? firstClose.receivedAt;
    const raw: Array<{ date: string; equity: number }> = [
      { date: anchor, equity },
    ];
    for (const event of ordered) {
      equity += event.pnl;
      raw.push({
        date: event.closedAt ?? event.receivedAt,
        equity,
      });
    }
    const points = withDrawdown(raw);
    const last = raw[raw.length - 1];
    const trough = worstDrawdown(points);
    return {
      points,
      source: "reconstructed",
      currentEquity: last.equity,
      asOf: last.date,
      maxDrawdownPct: trough?.drawdownPct ?? 0,
      maxDrawdownAt: trough?.date ?? null,
    };
  }

  return {
    points: [],
    source: "none",
    currentEquity: null,
    asOf: null,
    maxDrawdownPct: null,
    maxDrawdownAt: null,
  };
}

function withDrawdown(points: Array<{ date: string; equity: number }>): EquityPoint[] {
  let peak = Number.NEGATIVE_INFINITY;
  return points.map((point) => {
    peak = Math.max(peak, point.equity);
    const drawdownPct = peak > 0 ? ((point.equity - peak) / peak) * 100 : 0;
    return { date: point.date, equity: point.equity, drawdownPct };
  });
}

function worstDrawdown(points: EquityPoint[]): EquityPoint | null {
  let worst: EquityPoint | null = null;
  for (const point of points) {
    if (point.drawdownPct < 0 && (!worst || point.drawdownPct < worst.drawdownPct)) {
      worst = point;
    }
  }
  return worst;
}

function tradesPerMonthSinceStart(
  tradesClosed: number,
  now: Date,
  startInstant: string,
): number {
  const startMs = Date.parse(startInstant);
  const elapsed = Math.max(now.getTime() - startMs, MS_PER_MONTH / 30);
  return tradesClosed / (elapsed / MS_PER_MONTH);
}

function toBacktestTrade(event: ForwardTestEvent): BacktestTrade {
  return {
    id: event.id,
    market: event.market ?? "—",
    symbol: event.symbol ?? undefined,
    side: event.side ?? "long",
    openedAt: event.openedAt ?? event.closedAt ?? event.receivedAt,
    closedAt: event.closedAt ?? event.receivedAt,
    pnl: event.pnl ?? 0,
    rMultiple: event.rMultiple,
    entry: event.entry ?? undefined,
    exit: event.exit ?? undefined,
    notes: event.reason ?? undefined,
  };
}

function validateRequired(event: Omit<ForwardTestEvent, "receivedAt">): string | null {
  if (event.type === "open") {
    return (
      requireFields(event, [
        ["market", "market"],
        ["symbol", "symbol"],
        ["side", "side"],
        ["openedAt", "openedAt"],
        ["entry", "entry"],
        ["stop", "stop"],
        ["lots", "lots"],
        ["riskPct", "riskPct"],
      ]) ?? null
    );
  }
  if (event.type === "close") {
    return (
      requireFields(event, [
        ["market", "market"],
        ["side", "side"],
        ["closedAt", "closedAt"],
        ["exit", "exit"],
        ["pnl", "pnl"],
        ["rMultiple", "rMultiple"],
      ]) ?? null
    );
  }
  return (
    requireFields(event, [
      ["equity", "equity"],
      ["balance", "balance"],
      ["at", "at"],
    ]) ?? null
  );
}

function requireFields(
  event: Omit<ForwardTestEvent, "receivedAt">,
  fields: Array<[keyof Omit<ForwardTestEvent, "receivedAt">, string]>,
): string | null {
  for (const [key, label] of fields) {
    if (event[key] === null) return `${label} is required for ${event.type} events.`;
  }
  return null;
}

function validateRanges(event: Omit<ForwardTestEvent, "receivedAt">): string | null {
  if (event.entry !== null && event.entry <= 0) return "entry must be greater than 0.";
  if (event.stop !== null && event.stop <= 0) return "stop must be greater than 0.";
  if (event.exit !== null && event.exit <= 0) return "exit must be greater than 0.";
  if (event.lots !== null && (event.lots <= 0 || event.lots > 1000)) {
    return "lots must be greater than 0 and at most 1000.";
  }
  if (event.riskPct !== null && (event.riskPct < 0 || event.riskPct > 100)) {
    return "riskPct must be between 0 and 100.";
  }
  if (event.pnl !== null && Math.abs(event.pnl) > 1e8) return "pnl is out of range.";
  if (event.rMultiple !== null && Math.abs(event.rMultiple) > 1000) {
    return "rMultiple is out of range.";
  }
  if (event.equity !== null && (event.equity < 0 || event.equity > 1e9)) {
    return "equity must be between 0 and 1e9.";
  }
  if (event.balance !== null && (event.balance < 0 || event.balance > 1e9)) {
    return "balance must be between 0 and 1e9.";
  }
  return null;
}

function parseType(value: unknown): ForwardEventType | null {
  if (value === "open" || value === "close" || value === "equity") return value;
  return null;
}

function parseId(value: unknown): string | null {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER) {
    return String(value);
  }
  if (typeof value !== "string") return null;
  const id = value.trim();
  return ID_PATTERN.test(id) ? id : null;
}

function readMarket(
  body: Record<string, unknown>,
  key: string,
): { ok: true; value: ForwardMarket | null } | ParseFailure {
  if (!Object.hasOwn(body, key) || body[key] === null) return { ok: true, value: null };
  if (typeof body[key] !== "string") {
    return { ok: false, error: `${key} must be US30, NAS100, XAUUSD, or DE40.` };
  }
  const market = body[key].trim();
  if (!(FORWARD_TEST_MARKETS as readonly string[]).includes(market)) {
    return { ok: false, error: `${key} must be US30, NAS100, XAUUSD, or DE40.` };
  }
  return { ok: true, value: market as ForwardMarket };
}

function readSide(
  body: Record<string, unknown>,
  key: string,
): { ok: true; value: ForwardSide | null } | ParseFailure {
  if (!Object.hasOwn(body, key) || body[key] === null) return { ok: true, value: null };
  if (typeof body[key] !== "string") {
    return { ok: false, error: `${key} must be long or short.` };
  }
  const side = body[key].trim().toLowerCase();
  if (side === "long" || side === "buy") return { ok: true, value: "long" };
  if (side === "short" || side === "sell") return { ok: true, value: "short" };
  return { ok: false, error: `${key} must be long or short.` };
}

function readString(
  body: Record<string, unknown>,
  key: string,
  max: number,
): { ok: true; value: string | null } | ParseFailure {
  if (!Object.hasOwn(body, key) || body[key] === null) return { ok: true, value: null };
  if (typeof body[key] !== "string") return { ok: false, error: `${key} must be a string.` };
  const value = body[key].trim();
  if (!value) return { ok: true, value: null };
  if (value.length > max) return { ok: false, error: `${key} must be at most ${max} characters.` };
  return { ok: true, value };
}

function readNumber(
  body: Record<string, unknown>,
  key: string,
): { ok: true; value: number | null } | ParseFailure {
  if (!Object.hasOwn(body, key) || body[key] === null) return { ok: true, value: null };
  const value = coerceNumber(body[key]);
  if (value === null) return { ok: false, error: `${key} must be a number.` };
  return { ok: true, value };
}

function readTime(
  body: Record<string, unknown>,
  key: string,
): { ok: true; value: string | null } | ParseFailure {
  if (!Object.hasOwn(body, key) || body[key] === null) return { ok: true, value: null };
  if (typeof body[key] !== "string") {
    return { ok: false, error: `${key} must be an ISO-8601 timestamp.` };
  }
  const parsed = parseTimestamp(body[key]);
  if (!parsed) return { ok: false, error: `${key} must be an ISO-8601 timestamp.` };
  return { ok: true, value: parsed };
}

function coerceNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value.trim())) {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** Accept ISO-8601, or MT5-style `YYYY.MM.DD HH:MM:SS` treated as UTC. */
export function parseTimestamp(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const hasZone = /(?:z|[+-]\d{2}:?\d{2})$/i.test(trimmed);
  const mt5 =
    /^(\d{4})[./-](\d{2})[./-](\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(
      trimmed,
    );
  const ms =
    mt5 && !hasZone
      ? Date.parse(
          `${mt5[1]}-${mt5[2]}-${mt5[3]}T${mt5[4] ?? "00"}:${mt5[5] ?? "00"}:${mt5[6] ?? "00"}.000Z`,
        )
      : Date.parse(trimmed);
  if (!Number.isFinite(ms) || ms < MIN_TIME_MS || ms > MAX_TIME_MS) return null;
  return new Date(ms).toISOString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
