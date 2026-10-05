/**
 * Pure checks for the forward-test parser and summary.
 * Run: node --experimental-strip-types scripts/check-forward-test.mts
 */

import assert from "node:assert/strict";
import {
  applyForwardTestEvent,
  emptyForwardTestBook,
  isSampleForwardTestId,
  parseForwardTestEvent,
  summarizeForwardTest,
  type ForwardTestEvent,
} from "../src/lib/forward-test.ts";

function event(body: unknown, receivedAt: string): ForwardTestEvent {
  const parsed = parseForwardTestEvent(body);
  if (!parsed.ok) throw new Error(parsed.error);
  return { ...parsed.event, receivedAt };
}

const rejected = parseForwardTestEvent({ type: "open", id: "1" });
assert.equal(rejected.ok, false);

const badMarket = parseForwardTestEvent({
  type: "open",
  id: "9",
  market: "GBPUSD",
  symbol: "GBPUSD",
  side: "buy",
  openedAt: "2026-10-02T08:00:00Z",
  entry: 1.2,
  stop: 1.1,
  lots: 0.1,
  riskPct: 1,
});
assert.equal(badMarket.ok, false);

const open = event(
  {
    type: "open",
    id: 101,
    market: "US30",
    symbol: "US30",
    side: "buy",
    openedAt: "2026.10.02 08:00:00",
    entry: "42000.5",
    stop: 41800,
    lots: 0.2,
    riskPct: 1,
  },
  "2026-10-02T08:00:01.000Z",
);
assert.equal(open.id, "101");
assert.equal(open.side, "long");
assert.equal(open.openedAt, "2026-10-02T08:00:00.000Z");

const closeA = event(
  {
    type: "close",
    id: "101",
    market: "US30",
    side: "long",
    closedAt: "2026-10-03T16:00:00Z",
    exit: 42200,
    pnl: 100,
    rMultiple: 1,
  },
  "2026-10-03T16:00:01.000Z",
);
const closeB = event(
  {
    type: "close",
    id: "102",
    market: "XAUUSD",
    side: "long",
    closedAt: "2026-10-04T12:00:00Z",
    exit: 2600,
    pnl: -50,
    rMultiple: -0.5,
    reason: "stop",
  },
  "2026-10-04T12:00:01.000Z",
);

let book = emptyForwardTestBook();
const first = applyForwardTestEvent(book, open);
assert.equal(first.created, true);
const again = applyForwardTestEvent(first.book, { ...open, lots: 0.3 });
assert.equal(again.created, false);
assert.equal(again.book.events.length, 1);
assert.equal(again.book.events[0]?.lots, 0.3);
book = applyForwardTestEvent(again.book, closeA).book;
book = applyForwardTestEvent(book, closeB).book;

const summary = summarizeForwardTest(book.events, {
  storage: "local",
  now: new Date("2026-10-04T12:00:00.000Z"),
});
assert.equal(summary.tradesOpen, 0);
assert.equal(summary.tradesClosed, 2);
assert.equal(summary.closedTrades[0]?.id, "102");
assert.equal(summary.winRatePct, 50);
assert.equal(summary.avgR, 0.25);
assert.equal(summary.profitFactor, 2);
assert.equal(summary.currentEquity, 5050);
assert.equal(summary.equitySource, "reconstructed");
assert.equal(summary.startDate, "2026-10-02");
assert.equal(summary.startLabel, "2 October 2026");
assert.ok(summary.maxDrawdownPct !== null && summary.maxDrawdownPct < 0);
assert.equal(summary.emptyMessage, null);

const snapshot = event(
  {
    type: "equity",
    id: "eq-1",
    equity: 4900,
    balance: 5000,
    at: "2026-10-04T18:00:00Z",
  },
  "2026-10-04T18:00:01.000Z",
);
const withSnapshot = summarizeForwardTest([...book.events, snapshot], {
  storage: "local",
  now: new Date("2026-10-04T18:00:00.000Z"),
});
assert.equal(withSnapshot.equitySource, "snapshot");
assert.equal(withSnapshot.startDate, "2026-10-02");
assert.equal(withSnapshot.currentEquity, 4900);
assert.equal(withSnapshot.balance, 5000);
assert.ok(Math.abs((withSnapshot.maxDrawdownPct ?? 0) + 2) < 0.001);

const empty = summarizeForwardTest([], { storage: "blob" });
assert.equal(empty.status, "empty");
assert.equal(empty.startDate, null);
assert.equal(empty.startLabel, "Starting October 2026");
assert.equal(empty.emptyMessage, "Forward test starting October 2026 — no trades yet");

const equityFirst = event(
  {
    type: "equity",
    id: "eq-early",
    equity: 5000,
    balance: 5000,
    at: "2026-10-05T07:00:00Z",
  },
  "2026-10-05T07:00:01.000Z",
);
const laterOpen = event(
  {
    type: "open",
    id: "200",
    market: "DE40",
    symbol: "DE40",
    side: "long",
    openedAt: "2026-10-06T09:00:00Z",
    entry: 18000,
    stop: 17900,
    lots: 0.1,
    riskPct: 1,
  },
  "2026-10-06T09:00:01.000Z",
);
const fromEquity = summarizeForwardTest([laterOpen, equityFirst], {
  storage: "blob",
  now: new Date("2026-10-06T12:00:00.000Z"),
});
assert.equal(fromEquity.startDate, "2026-10-05");
assert.equal(fromEquity.startLabel, "5 October 2026");

const closeOnly = summarizeForwardTest([closeA], {
  storage: "blob",
  now: new Date("2026-10-04T12:00:00.000Z"),
});
assert.equal(closeOnly.startDate, null);
assert.equal(closeOnly.startLabel, "Starting October 2026");
assert.equal(isSampleForwardTestId("SAMPLE-FT-1"), true);
assert.equal(isSampleForwardTestId("sample-ft-eq"), true);
assert.equal(isSampleForwardTestId("12345678"), false);

console.log("forward-test checks passed");
