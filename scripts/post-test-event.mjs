/**
 * POST one sample event to the forward-test API.
 *
 * Local (dev server must be running, with the same FORWARD_TEST_TOKEN):
 *   FORWARD_TEST_TOKEN=dev-token node scripts/post-test-event.mjs
 *   FORWARD_TEST_TOKEN=dev-token node scripts/post-test-event.mjs --type close
 *   FORWARD_TEST_TOKEN=dev-token node scripts/post-test-event.mjs --type equity
 *
 * A real payload can be posted to the demo host only with --file and
 * --confirm-remote. Built-in SAMPLE-FT ids are refused off localhost,
 * including when --confirm-remote is set. Vercel also rejects those ids.
 *
 *   FORWARD_TEST_URL=https://dan-c.vercel.app \
 *   FORWARD_TEST_TOKEN=... \
 *   node scripts/post-test-event.mjs --file ./event.json --confirm-remote
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
const type = flag("--type") ?? "open";
const file = flag("--file");

if (!token) {
  console.error("Set FORWARD_TEST_TOKEN to the same value as the server.");
  process.exit(1);
}

const remote = !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(base);

const samples = {
  open: {
    type: "open",
    id: "SAMPLE-FT-1",
    market: "XAUUSD",
    symbol: "XAUUSD",
    side: "long",
    openedAt: "2026-10-02T08:00:00Z",
    entry: 2650.2,
    stop: 2635.4,
    lots: 0.1,
    riskPct: 1,
  },
  close: {
    type: "close",
    id: "SAMPLE-FT-1",
    market: "XAUUSD",
    symbol: "XAUUSD",
    side: "long",
    openedAt: "2026-10-02T08:00:00Z",
    entry: 2650.2,
    stop: 2635.4,
    lots: 0.1,
    riskPct: 1,
    closedAt: "2026-10-03T16:00:00Z",
    exit: 2672.8,
    reason: "chandelier",
    pnl: 48.5,
    rMultiple: 1.2,
  },
  equity: {
    type: "equity",
    id: "SAMPLE-FT-EQ-2026-10-03T16:00:00Z",
    equity: 5048.5,
    balance: 5048.5,
    at: "2026-10-03T16:00:00Z",
  },
};

let payload;
if (file) {
  payload = JSON.parse(await readFile(file, "utf8"));
} else if (!Object.hasOwn(samples, type)) {
  console.error("--type must be open, close, or equity.");
  process.exit(1);
} else {
  payload = samples[type];
}

function isSampleId(id) {
  return typeof id === "string" && id.toUpperCase().startsWith("SAMPLE-FT");
}

const payloadId = payload && payload.id != null ? String(payload.id) : "";
if (remote && (!file || isSampleId(payloadId))) {
  console.error(
    `Refusing to post SAMPLE-FT data to ${base}. Built-in samples only go to localhost.`,
  );
  process.exit(1);
}
if (remote && !args.includes("--confirm-remote")) {
  console.error(
    `Refusing to post to ${base}. Pass --file with a real payload and --confirm-remote if that demo book is the one you mean to update.`,
  );
  process.exit(1);
}

const response = await fetch(`${base}/api/forward-test/events`, {
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
