import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  BlobPreconditionFailedError,
  get,
  put,
} from "@vercel/blob";
import {
  applyForwardTestEvent,
  emptyForwardTestBook,
  summarizeForwardTest,
  unavailableForwardTestSummary,
  type ForwardTestBook,
  type ForwardTestEvent,
  type ForwardTestStorage,
  type ForwardTestSummary,
} from "@/lib/forward-test";

const BLOB_PATH = "forward-test/book.json";
const LOCAL_PATH = path.join(process.cwd(), ".data", "forward-test", "book.json");

export class ForwardTestStoreError extends Error {
  constructor(
    message: string,
    readonly code: "unconfigured" | "corrupt",
  ) {
    super(message);
    this.name = "ForwardTestStoreError";
  }
}

let writeTail: Promise<void> = Promise.resolve();

function withWriteLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeTail.then(fn, fn);
  writeTail = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function onVercel(): boolean {
  return process.env.VERCEL === "1";
}

export function forwardTestStorageMode(): ForwardTestStorage {
  if (process.env.BLOB_READ_WRITE_TOKEN) return "blob";
  if (onVercel()) return "unconfigured";
  return "local";
}

export async function loadForwardTestSummary(): Promise<ForwardTestSummary> {
  const storage = forwardTestStorageMode();
  if (storage === "unconfigured") {
    return summarizeForwardTest([], { storage });
  }
  try {
    const { book } = await readBook();
    return summarizeForwardTest(book.events, { storage });
  } catch (error) {
    console.error(
      "forward-test read failed",
      error instanceof Error ? error.name : "unknown",
    );
    return unavailableForwardTestSummary(storage);
  }
}

export async function upsertForwardTestEvent(
  event: ForwardTestEvent,
): Promise<{ created: boolean }> {
  const storage = forwardTestStorageMode();
  if (storage === "unconfigured") {
    throw new ForwardTestStoreError(
      "BLOB_READ_WRITE_TOKEN is not set.",
      "unconfigured",
    );
  }
  return withWriteLock(() =>
    storage === "blob" ? upsertBlob(event) : upsertLocal(event),
  );
}

async function upsertBlob(event: ForwardTestEvent): Promise<{ created: boolean }> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const loaded = await readBlob();
    const applied = applyForwardTestEvent(loaded.book, event);
    try {
      await put(BLOB_PATH, JSON.stringify(applied.book), {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
        cacheControlMaxAge: 0,
        ...(loaded.etag ? { ifMatch: loaded.etag } : {}),
      });
      return { created: applied.created };
    } catch (error) {
      if (error instanceof BlobPreconditionFailedError) {
        lastError = error;
        continue;
      }
      throw error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Could not save the forward-test event.");
}

async function upsertLocal(event: ForwardTestEvent): Promise<{ created: boolean }> {
  const { book } = await readLocal();
  const applied = applyForwardTestEvent(book, event);
  await writeLocal(applied.book);
  return { created: applied.created };
}

async function readBook(): Promise<{ book: ForwardTestBook; etag: string | null }> {
  if (forwardTestStorageMode() === "blob") return readBlob();
  return readLocal();
}

async function readBlob(): Promise<{ book: ForwardTestBook; etag: string | null }> {
  const result = await get(BLOB_PATH, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200) {
    return { book: emptyForwardTestBook(), etag: null };
  }
  const text = await new Response(result.stream).text();
  return { book: parseStoredBook(text), etag: result.blob.etag };
}

async function readLocal(): Promise<{ book: ForwardTestBook; etag: string | null }> {
  try {
    const text = await readFile(LOCAL_PATH, "utf8");
    return { book: parseStoredBook(text), etag: null };
  } catch (error) {
    if (isNotFound(error)) return { book: emptyForwardTestBook(), etag: null };
    throw error;
  }
}

async function writeLocal(book: ForwardTestBook): Promise<void> {
  await mkdir(path.dirname(LOCAL_PATH), { recursive: true });
  const tmp = `${LOCAL_PATH}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(book), "utf8");
  await rename(tmp, LOCAL_PATH);
}

function parseStoredBook(text: string): ForwardTestBook {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new ForwardTestStoreError("Forward-test store is not valid JSON.", "corrupt");
  }
  if (!isBook(parsed)) {
    throw new ForwardTestStoreError("Forward-test store has an unexpected shape.", "corrupt");
  }
  return parsed;
}

function isBook(value: unknown): value is ForwardTestBook {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const book = value as { schemaVersion?: unknown; events?: unknown };
  if (book.schemaVersion !== 1 || !Array.isArray(book.events)) return false;
  return book.events.every(isStoredEvent);
}

function isStoredEvent(value: unknown): value is ForwardTestEvent {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const event = value as Partial<ForwardTestEvent>;
  return (
    (event.type === "open" || event.type === "close" || event.type === "equity") &&
    typeof event.id === "string" &&
    typeof event.receivedAt === "string"
  );
}

function isNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "ENOENT"
  );
}
