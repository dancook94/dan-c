/**
 * Paper BTC/ETH forward-test snapshot.
 *
 * The daily job POSTs one full book. This module is the contract:
 * it rejects anything else, and it stores the canonical form described
 * in data/crypto-forward.schema.json and the README.
 *
 * Blob object (do not confuse with the forex book): crypto-forward/book.json
 */

export const CRYPTO_FORWARD_BLOB_PATH = "crypto-forward/book.json";

export const CRYPTO_FORWARD_START_DATE = "2026-10-11";
export const CRYPTO_FORWARD_REVIEW_DATE = "2027-04-12";
export const CRYPTO_FORWARD_STARTING_NOTIONAL = 5_000;
export const CRYPTO_FORWARD_COST_PCT = 0.15;

export const CRYPTO_FORWARD_LABEL = "Paper only, no real orders";

export const CRYPTO_FORWARD_EMPTY_MESSAGE =
  "No snapshot yet. Equity curves, positions, and fills appear after the daily paper book is posted.";

/** Research backtest of this idea. Not a result of the paper book. */
export const CRYPTO_FORWARD_BACKTEST = {
  annualReturnPct: 37.4,
  maxDrawdownPct: -57,
  tradesPerYear: 13,
} as const;

const MIN_TIME_MS = Date.parse("2016-01-01T00:00:00.000Z");
const MAX_TIME_MS = Date.parse("2100-01-01T00:00:00.000Z");
const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const ID = /^[A-Za-z][A-Za-z0-9_-]{0,31}$/;
const SYMBOL = /^[A-Z][A-Z0-9]{0,15}$/;

const MAX_LINES = 8;
const MAX_BENCHMARKS = 8;
const MAX_POSITIONS = 12;
const MAX_CURVE = 4_000;
const MAX_TRADES = 10_000;

const BOOK_KEYS = [
  "schemaVersion",
  "updatedAt",
  "startDate",
  "reviewDate",
  "currency",
  "lines",
  "benchmarks",
  "trades",
] as const;

const SERIES_KEYS = [
  "id",
  "name",
  "equity",
  "returnPct",
  "maxDDPct",
  "cash",
  "positions",
  "equityCurve",
] as const;

const POSITION_KEYS = ["symbol", "qty", "weightPct"] as const;
const POINT_KEYS = ["date", "equity"] as const;
const TRADE_KEYS = ["date", "line", "symbol", "side", "qty", "price", "cost"] as const;

export type CryptoForwardPosition = {
  symbol: string;
  qty: number;
  /** Percent of that coin's sleeve, 0–100. 100 means fully invested. */
  weightPct: number;
};

export type CryptoForwardPoint = {
  date: string;
  equity: number;
};

export type CryptoForwardSeries = {
  id: string;
  name: string;
  equity: number;
  returnPct: number;
  /** Peak-to-trough return in percent. 0, or negative. A 57% drawdown is -57. */
  maxDDPct: number;
  /** Uninvested USDT. An index benchmark may be 0. */
  cash: number;
  positions: CryptoForwardPosition[];
  equityCurve: CryptoForwardPoint[];
};

export type CryptoForwardSide = "BUY" | "SELL";

export type CryptoForwardTrade = {
  date: string;
  line: string;
  symbol: string;
  side: CryptoForwardSide;
  qty: number;
  price: number;
  cost: number;
};

export type CryptoForwardBook = {
  schemaVersion: 1;
  updatedAt: string;
  startDate: string;
  reviewDate: string;
  currency: "USDT";
  lines: CryptoForwardSeries[];
  benchmarks: CryptoForwardSeries[];
  trades: CryptoForwardTrade[];
};

export type CryptoForwardEmpty = {
  empty: true;
};

type ParseOk = { ok: true; book: CryptoForwardBook };
type ParseFailure = { ok: false; error: string };

export function parseCryptoForwardBook(input: unknown): ParseOk | ParseFailure {
  if (!isRecord(input)) {
    return { ok: false, error: "Body must be a JSON object." };
  }
  const extra = unknownKey(input, BOOK_KEYS);
  if (extra) return { ok: false, error: `Unexpected field ${extra}.` };

  if (input.schemaVersion !== 1) {
    return { ok: false, error: "schemaVersion must be 1." };
  }
  if (input.currency !== "USDT") {
    return { ok: false, error: "currency must be USDT." };
  }

  const updatedAt = parseInstant(input.updatedAt, "updatedAt");
  if (typeof updatedAt !== "string") return updatedAt;
  const startDate = parseDay(input.startDate, "startDate");
  if (typeof startDate !== "string") return startDate;
  const reviewDate = parseDay(input.reviewDate, "reviewDate");
  if (typeof reviewDate !== "string") return reviewDate;
  if (reviewDate < startDate) {
    return { ok: false, error: "reviewDate must be on or after startDate." };
  }
  if (updatedAt < `${startDate}T00:00:00.000Z`) {
    return { ok: false, error: "updatedAt must be on or after startDate." };
  }

  if (!Array.isArray(input.lines)) {
    return { ok: false, error: "lines must be an array." };
  }
  if (input.lines.length < 1 || input.lines.length > MAX_LINES) {
    return { ok: false, error: `lines must contain 1 to ${MAX_LINES} books.` };
  }
  if (!Array.isArray(input.benchmarks)) {
    return { ok: false, error: "benchmarks must be an array." };
  }
  if (input.benchmarks.length > MAX_BENCHMARKS) {
    return {
      ok: false,
      error: `benchmarks must contain at most ${MAX_BENCHMARKS} books.`,
    };
  }
  if (!Array.isArray(input.trades)) {
    return { ok: false, error: "trades must be an array." };
  }
  if (input.trades.length > MAX_TRADES) {
    return { ok: false, error: `trades must contain at most ${MAX_TRADES} fills.` };
  }

  const lines: CryptoForwardSeries[] = [];
  for (let index = 0; index < input.lines.length; index += 1) {
    const parsed = parseSeries(input.lines[index], `lines[${index}]`, startDate);
    if ("error" in parsed) return { ok: false, error: parsed.error };
    lines.push(parsed);
  }
  const benchmarks: CryptoForwardSeries[] = [];
  for (let index = 0; index < input.benchmarks.length; index += 1) {
    const parsed = parseSeries(
      input.benchmarks[index],
      `benchmarks[${index}]`,
      startDate,
    );
    if ("error" in parsed) return { ok: false, error: parsed.error };
    benchmarks.push(parsed);
  }

  const ids = [...lines, ...benchmarks].map((series) => series.id);
  if (new Set(ids).size !== ids.length) {
    return { ok: false, error: "Line and benchmark ids must be unique." };
  }
  const idSet = new Set(ids);

  const trades: CryptoForwardTrade[] = [];
  for (let index = 0; index < input.trades.length; index += 1) {
    const parsed = parseTrade(input.trades[index], `trades[${index}]`, startDate, idSet);
    if ("error" in parsed) return { ok: false, error: parsed.error };
    trades.push(parsed);
  }

  return {
    ok: true,
    book: {
      schemaVersion: 1,
      updatedAt,
      startDate,
      reviewDate,
      currency: "USDT",
      lines,
      benchmarks,
      trades,
    },
  };
}

function parseSeries(
  input: unknown,
  label: string,
  startDate: string,
): CryptoForwardSeries | ParseFailure {
  if (!isRecord(input)) return { ok: false, error: `${label} must be an object.` };
  const extra = unknownKey(input, SERIES_KEYS);
  if (extra) return { ok: false, error: `${label}.${extra} is not a snapshot field.` };

  const id = parseId(input.id, `${label}.id`);
  if (typeof id !== "string") return id;
  const name = parseName(input.name, `${label}.name`);
  if (typeof name !== "string") return name;
  const equity = parseNumber(input.equity, `${label}.equity`, 0, 1e12);
  if (typeof equity !== "number") return equity;
  const returnPct = parseNumber(input.returnPct, `${label}.returnPct`, -100, 1e6);
  if (typeof returnPct !== "number") return returnPct;
  const maxDDPct = parseNumber(input.maxDDPct, `${label}.maxDDPct`, -100, 0);
  if (typeof maxDDPct !== "number") return maxDDPct;
  const cash = parseNumber(input.cash, `${label}.cash`, 0, 1e12);
  if (typeof cash !== "number") return cash;

  if (!Array.isArray(input.positions)) {
    return { ok: false, error: `${label}.positions must be an array.` };
  }
  if (input.positions.length > MAX_POSITIONS) {
    return {
      ok: false,
      error: `${label}.positions must contain at most ${MAX_POSITIONS} rows.`,
    };
  }
  const positions: CryptoForwardPosition[] = [];
  for (let index = 0; index < input.positions.length; index += 1) {
    const parsed = parsePosition(input.positions[index], `${label}.positions[${index}]`);
    if ("error" in parsed) return parsed;
    positions.push(parsed);
  }
  const symbols = positions.map((position) => position.symbol);
  if (new Set(symbols).size !== symbols.length) {
    return { ok: false, error: `${label}.positions symbols must be unique.` };
  }

  if (!Array.isArray(input.equityCurve)) {
    return { ok: false, error: `${label}.equityCurve must be an array.` };
  }
  if (input.equityCurve.length < 1 || input.equityCurve.length > MAX_CURVE) {
    return {
      ok: false,
      error: `${label}.equityCurve must contain 1 to ${MAX_CURVE} points.`,
    };
  }
  const equityCurve: CryptoForwardPoint[] = [];
  for (let index = 0; index < input.equityCurve.length; index += 1) {
    const parsed = parsePoint(
      input.equityCurve[index],
      `${label}.equityCurve[${index}]`,
      startDate,
    );
    if ("error" in parsed) return parsed;
    equityCurve.push(parsed);
  }
  const dates = equityCurve.map((point) => point.date);
  if (new Set(dates).size !== dates.length) {
    return { ok: false, error: `${label}.equityCurve dates must be unique.` };
  }
  equityCurve.sort((a, b) => a.date.localeCompare(b.date));

  return { id, name, equity, returnPct, maxDDPct, cash, positions, equityCurve };
}

function parsePosition(
  input: unknown,
  label: string,
): CryptoForwardPosition | ParseFailure {
  if (!isRecord(input)) return { ok: false, error: `${label} must be an object.` };
  const extra = unknownKey(input, POSITION_KEYS);
  if (extra) return { ok: false, error: `${label}.${extra} is not a position field.` };
  const symbol = parseSymbol(input.symbol, `${label}.symbol`);
  if (typeof symbol !== "string") return symbol;
  const qty = parseNumber(input.qty, `${label}.qty`, 0, 1e9);
  if (typeof qty !== "number") return qty;
  const weightPct = parseNumber(input.weightPct, `${label}.weightPct`, 0, 100);
  if (typeof weightPct !== "number") return weightPct;
  return { symbol, qty, weightPct };
}

function parsePoint(
  input: unknown,
  label: string,
  startDate: string,
): CryptoForwardPoint | ParseFailure {
  if (!isRecord(input)) return { ok: false, error: `${label} must be an object.` };
  const extra = unknownKey(input, POINT_KEYS);
  if (extra) return { ok: false, error: `${label}.${extra} is not an equity-curve field.` };
  const date = parseDay(input.date, `${label}.date`);
  if (typeof date !== "string") return date;
  if (date < startDate) {
    return { ok: false, error: `${label}.date must be on or after startDate.` };
  }
  const equity = parseNumber(input.equity, `${label}.equity`, 0, 1e12);
  if (typeof equity !== "number") return equity;
  return { date, equity };
}

function parseTrade(
  input: unknown,
  label: string,
  startDate: string,
  ids: Set<string>,
): CryptoForwardTrade | ParseFailure {
  if (!isRecord(input)) return { ok: false, error: `${label} must be an object.` };
  const extra = unknownKey(input, TRADE_KEYS);
  if (extra) return { ok: false, error: `${label}.${extra} is not a trade field.` };
  const date = parseInstant(input.date, `${label}.date`);
  if (typeof date !== "string") return date;
  if (date.slice(0, 10) < startDate) {
    return { ok: false, error: `${label}.date must be on or after startDate.` };
  }
  const line = parseId(input.line, `${label}.line`);
  if (typeof line !== "string") return line;
  if (!ids.has(line)) {
    return { ok: false, error: `${label}.line must match a line or benchmark id.` };
  }
  const symbol = parseSymbol(input.symbol, `${label}.symbol`);
  if (typeof symbol !== "string") return symbol;
  const side = parseSide(input.side, `${label}.side`);
  if (typeof side !== "string") return side;
  const qty = parseNumber(input.qty, `${label}.qty`, 0, 1e9, false);
  if (typeof qty !== "number") return qty;
  const price = parseNumber(input.price, `${label}.price`, 0, 1e12, false);
  if (typeof price !== "number") return price;
  const cost = parseNumber(input.cost, `${label}.cost`, 0, 1e12);
  if (typeof cost !== "number") return cost;
  return { date, line, symbol, side, qty, price, cost };
}

function parseId(value: unknown, label: string): string | ParseFailure {
  if (typeof value !== "string" || !ID.test(value) || value === "date") {
    return {
      ok: false,
      error: `${label} must be a short slug (a letter, then letters, numbers, _ or -).`,
    };
  }
  return value;
}

function parseName(value: unknown, label: string): string | ParseFailure {
  if (typeof value !== "string") return { ok: false, error: `${label} must be a string.` };
  const name = value.trim();
  if (!name || name.length > 80) {
    return { ok: false, error: `${label} must be 1 to 80 characters.` };
  }
  if (/[\u0000-\u001F]/.test(name)) {
    return { ok: false, error: `${label} must not contain control characters.` };
  }
  return name;
}

function parseSymbol(value: unknown, label: string): string | ParseFailure {
  if (typeof value !== "string" || !SYMBOL.test(value)) {
    return { ok: false, error: `${label} must be an uppercase symbol such as BTC or ETH.` };
  }
  return value;
}

function parseSide(value: unknown, label: string): CryptoForwardSide | ParseFailure {
  if (typeof value !== "string") {
    return { ok: false, error: `${label} must be BUY or SELL.` };
  }
  const side = value.trim().toUpperCase();
  if (side === "BUY" || side === "SELL") return side;
  return { ok: false, error: `${label} must be BUY or SELL.` };
}

function parseNumber(
  value: unknown,
  label: string,
  min: number,
  max: number,
  allowZero = true,
): number | ParseFailure {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return { ok: false, error: `${label} must be a number.` };
  }
  if (value < min || value > max || (!allowZero && value === 0)) {
    return { ok: false, error: `${label} is out of range.` };
  }
  return value;
}

function parseDay(value: unknown, label: string): string | ParseFailure {
  if (typeof value !== "string" || !DAY.test(value)) {
    return { ok: false, error: `${label} must be a YYYY-MM-DD date.` };
  }
  const ms = Date.parse(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(ms) || ms < MIN_TIME_MS || ms >= MAX_TIME_MS) {
    return { ok: false, error: `${label} must be a YYYY-MM-DD date.` };
  }
  if (new Date(ms).toISOString().slice(0, 10) !== value) {
    return { ok: false, error: `${label} must be a real calendar date.` };
  }
  return value;
}

function parseInstant(value: unknown, label: string): string | ParseFailure {
  if (typeof value !== "string" || !/T\d{2}:\d{2}/.test(value)) {
    return { ok: false, error: `${label} must be an ISO-8601 timestamp.` };
  }
  const ms = Date.parse(value);
  if (!Number.isFinite(ms) || ms < MIN_TIME_MS || ms >= MAX_TIME_MS) {
    return { ok: false, error: `${label} must be an ISO-8601 timestamp.` };
  }
  return new Date(ms).toISOString();
}

function unknownKey(
  body: Record<string, unknown>,
  allowed: readonly string[],
): string | null {
  for (const key of Object.keys(body)) {
    if (!allowed.includes(key)) return key;
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
