/**
 * POST one crypto paper snapshot.
 *
 * Local (dev server must be running, with the same FORWARD_TEST_TOKEN):
 *   FORWARD_TEST_TOKEN=dev-token node scripts/post-crypto-forward.mjs
 *
 * A file can be posted to the demo host only with --confirm-remote.
 * The built-in sample never leaves localhost. This script does not print
 * the token.
 *
 *   FORWARD_TEST_URL=https://dan-c.vercel.app \
 *   FORWARD_TEST_TOKEN=... \
 *   node scripts/post-crypto-forward.mjs --file ./snapshot.json --confirm-remote
 */

import { readFile } from "node:fs/promises";

const args = process.argv.slice(2);

function flag(name) {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  return args[index + 1];
}

const base = (process.env.FORWARD_TEST_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);
const token = process.env.FORWARD_TEST_TOKEN;
const file = flag("--file");

if (!token) {
  console.error("Set FORWARD_TEST_TOKEN to the same value as the server.");
  process.exit(1);
}

const remote = !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(base);

const sample = {
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
      side: "BUY",
      qty: 0.02979781,
      price: 83773.12,
      cost: 3.74438342,
    },
    {
      date: "2026-10-12T00:00:00Z",
      line: "A",
      symbol: "ETH",
      side: "BUY",
      qty: 0.98396321,
      price: 2536.94,
      cost: 3.74438342,
    },
    {
      date: "2026-10-12T00:00:00Z",
      line: "B",
      symbol: "BTC",
      side: "BUY",
      qty: 0.02979781,
      price: 83773.12,
      cost: 3.74438342,
    },
    {
      date: "2026-10-12T00:00:00Z",
      line: "B",
      symbol: "ETH",
      side: "BUY",
      qty: 0.98396321,
      price: 2536.94,
      cost: 3.74438342,
    },
    {
      date: "2026-10-12T00:00:00Z",
      line: "C",
      symbol: "BTC",
      side: "BUY",
      qty: 0.02979781,
      price: 83773.12,
      cost: 3.74438342,
    },
    {
      date: "2026-10-12T00:00:00Z",
      line: "C",
      symbol: "ETH",
      side: "BUY",
      qty: 0.902991,
      price: 2536.94,
      cost: 3.43625097,
    },
    {
      date: "2026-10-12T00:00:00Z",
      line: "BH",
      symbol: "BTC",
      side: "BUY",
      qty: 0.02979781,
      price: 83773.12,
      cost: 3.74438342,
    },
    {
      date: "2026-10-12T00:00:00Z",
      line: "BH",
      symbol: "ETH",
      side: "BUY",
      qty: 0.98396321,
      price: 2536.94,
      cost: 3.74438342,
    },
  ],
};

let payload;
if (file) {
  payload = JSON.parse(await readFile(file, "utf8"));
} else {
  payload = sample;
}

if (remote && !file) {
  console.error(
    `Refusing to post the built-in sample to ${base}. Samples only go to localhost.`,
  );
  process.exit(1);
}
if (remote && !args.includes("--confirm-remote")) {
  console.error(
    `Refusing to post to ${base}. Pass --file and --confirm-remote if that book is the one you mean to replace.`,
  );
  process.exit(1);
}

const response = await fetch(`${base}/api/crypto-forward/update`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

const text = await response.text();
console.log(`${response.status} ${response.statusText}`);
console.log(text);
if (!response.ok) process.exit(1);
