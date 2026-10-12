/**
 * Parser and local-store checks for the crypto paper book.
 * Run: node --experimental-strip-types scripts/check-crypto-forward.mts
 *
 * Does not call Blob, and does not print secrets.
 */

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { authorizeForwardTest } from "../src/lib/forward-test-auth.ts";
import {
  CRYPTO_FORWARD_BLOB_PATH,
  parseCryptoForwardBook,
} from "../src/lib/crypto-forward.ts";

assert.equal(CRYPTO_FORWARD_BLOB_PATH, "crypto-forward/book.json");
assert.notEqual(CRYPTO_FORWARD_BLOB_PATH, "forward-test/book.json");

const storeSource = await readFile(
  new URL("../src/lib/crypto-forward-store.ts", import.meta.url),
  "utf8",
);
assert.match(storeSource, /CRYPTO_FORWARD_BLOB_PATH/);
assert.match(storeSource, /"crypto-forward", "book\.json"/);
assert.doesNotMatch(storeSource, /put\(\s*["']forward-test/);
assert.match(storeSource, /allowOverwrite:\s*true/);

const flat = {
  schemaVersion: 1,
  updatedAt: "2026-10-12T07:32:16Z",
  startDate: "2026-10-11",
  reviewDate: "2027-04-12",
  currency: "USDT",
  lines: [
    {
      id: "A",
      name: "BTC+ETH SMA100",
      equity: 5000,
      returnPct: 0,
      maxDDPct: 0,
      cash: 0,
      positions: [
        { symbol: "BTC", qty: 0.02979781, weightPct: 100 },
        { symbol: "ETH", qty: 0.98396321, weightPct: 100 },
      ],
      equityCurve: [{ date: "2026-10-11", equity: 5000 }],
    },
    {
      id: "B",
      name: "BTC+ETH SMA150",
      equity: 5000,
      returnPct: 0,
      maxDDPct: 0,
      cash: 0,
      positions: [
        { symbol: "BTC", qty: 0.02979781, weightPct: 100 },
        { symbol: "ETH", qty: 0.98396321, weightPct: 100 },
      ],
      equityCurve: [{ date: "2026-10-11", equity: 5000 }],
    },
    {
      id: "C",
      name: "SMA100 40% vol target",
      equity: 5000,
      returnPct: 0,
      maxDDPct: 0,
      cash: 205.73,
      positions: [
        { symbol: "BTC", qty: 0.02979781, weightPct: 100 },
        { symbol: "ETH", qty: 0.902991, weightPct: 91.8 },
      ],
      equityCurve: [{ date: "2026-10-11", equity: 5000 }],
    },
  ],
  benchmarks: [
    {
      id: "BH",
      name: "Buy and hold 50/50",
      equity: 5000,
      returnPct: 0,
      maxDDPct: 0,
      cash: 0,
      positions: [
        { symbol: "BTC", qty: 0.02979781, weightPct: 100 },
        { symbol: "ETH", qty: 0.98396321, weightPct: 100 },
      ],
      equityCurve: [{ date: "2026-10-11", equity: 5000 }],
    },
    {
      id: "SPX",
      name: "S&P 500 price index",
      equity: 5000,
      returnPct: 0,
      maxDDPct: 0,
      cash: 0,
      positions: [],
      equityCurve: [{ date: "2026-10-11", equity: 5000 }],
    },
  ],
  trades: [
    {
      date: "2026-10-12T00:00:00Z",
      line: "A",
      symbol: "BTC",
      side: "buy",
      qty: 0.02979781,
      price: 83773.12,
      cost: 3.74438342,
    },
    {
      date: "2026-10-12T00:00:00Z",
      line: "C",
      symbol: "ETH",
      side: "SELL",
      qty: 0.902991,
      price: 2536.94,
      cost: 3.43625097,
    },
  ],
};

const parsed = parseCryptoForwardBook(flat);
assert.equal(parsed.ok, true);
if (!parsed.ok) throw new Error("unreachable");
assert.equal(parsed.book.updatedAt, "2026-10-12T07:32:16.000Z");
assert.equal(parsed.book.currency, "USDT");
assert.equal(parsed.book.lines[0]?.id, "A");
assert.equal(parsed.book.lines[2]?.cash, 205.73);
assert.equal(parsed.book.lines[2]?.positions[1]?.weightPct, 91.8);
assert.equal(parsed.book.trades[0]?.side, "BUY");
assert.equal(parsed.book.benchmarks[1]?.positions.length, 0);

const unsorted = structuredClone(flat);
unsorted.lines[0].equityCurve = [
  { date: "2026-10-13", equity: 5000 },
  { date: "2026-10-11", equity: 5000 },
];
const sorted = parseCryptoForwardBook(unsorted);
assert.equal(sorted.ok, true);
if (sorted.ok) {
  assert.deepEqual(
    sorted.book.lines[0]?.equityCurve.map((point) => point.date),
    ["2026-10-11", "2026-10-13"],
  );
}

function rejects(body: unknown, fragment: string) {
  const result = parseCryptoForwardBook(body);
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, new RegExp(fragment));
}

rejects({ type: "equity", equity: 1 }, "Unexpected field");
rejects({ ...flat, currency: "GBP" }, "USDT");
rejects({ ...flat, schemaVersion: 2 }, "schemaVersion");
const positiveDd = structuredClone(flat);
positiveDd.lines[0].maxDDPct = 57;
rejects(positiveDd, "maxDDPct");
const unknownLine = structuredClone(flat);
unknownLine.trades[0].line = "Z";
rejects(unknownLine, "line");
const duplicate = structuredClone(flat);
duplicate.benchmarks[0].id = "A";
rejects(duplicate, "unique");
const duplicateDate = structuredClone(flat);
duplicateDate.lines[0].equityCurve = [
  { date: "2026-10-11", equity: 5000 },
  { date: "2026-10-11", equity: 5000 },
];
rejects(duplicateDate, "dates must be unique");
const early = structuredClone(flat);
early.reviewDate = "2026-10-01";
rejects(early, "reviewDate");
rejects({ ...flat, lines: [] }, "lines");
const extra = structuredClone(flat);
(extra as { note?: string }).note = "nope";
rejects(extra, "Unexpected field");

const previousToken = process.env.FORWARD_TEST_TOKEN;
process.env.FORWARD_TEST_TOKEN = "local-check-token";
assert.equal(
  authorizeForwardTest(
    new Request("http://localhost/api/crypto-forward/update", {
      headers: { Authorization: "Bearer local-check-token" },
    }),
  ),
  true,
);
assert.equal(
  authorizeForwardTest(
    new Request("http://localhost/api/crypto-forward/update", {
      headers: { Authorization: "Bearer wrong-token" },
    }),
  ),
  false,
);
assert.equal(
  authorizeForwardTest(new Request("http://localhost/api/crypto-forward/update")),
  false,
);
if (previousToken === undefined) delete process.env.FORWARD_TEST_TOKEN;
else process.env.FORWARD_TEST_TOKEN = previousToken;

console.log("crypto-forward checks passed");
