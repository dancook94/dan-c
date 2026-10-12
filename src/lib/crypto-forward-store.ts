import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { get, put } from "@vercel/blob";
import {
  CRYPTO_FORWARD_BLOB_PATH,
  parseCryptoForwardBook,
  type CryptoForwardBook,
} from "@/lib/crypto-forward";

const LOCAL_PATH = path.join(process.cwd(), ".data", "crypto-forward", "book.json");

export type CryptoForwardStorage = "blob" | "local" | "unconfigured";

export type CryptoForwardLoad =
  | { status: "ready"; storage: CryptoForwardStorage; book: CryptoForwardBook }
  | { status: "empty"; storage: CryptoForwardStorage }
  | { status: "unavailable"; storage: CryptoForwardStorage };

export class CryptoForwardStoreError extends Error {
  constructor(
    message: string,
    readonly code: "unconfigured" | "corrupt",
  ) {
    super(message);
    this.name = "CryptoForwardStoreError";
  }
}

function onVercel(): boolean {
  return process.env.VERCEL === "1";
}

export function cryptoForwardStorageMode(): CryptoForwardStorage {
  if (process.env.BLOB_READ_WRITE_TOKEN) return "blob";
  if (onVercel()) return "unconfigured";
  return "local";
}

/**
 * Replace the crypto paper book.
 * One writer, so a plain Blob put with allowOverwrite is enough.
 * This never reads or writes forward-test/book.json.
 */
export async function saveCryptoForwardBook(book: CryptoForwardBook): Promise<void> {
  const storage = cryptoForwardStorageMode();
  if (storage === "unconfigured") {
    throw new CryptoForwardStoreError(
      "BLOB_READ_WRITE_TOKEN is not set.",
      "unconfigured",
    );
  }
  const body = JSON.stringify(book);
  if (storage === "blob") {
    await put(CRYPTO_FORWARD_BLOB_PATH, body, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 0,
    });
    return;
  }
  await mkdir(path.dirname(LOCAL_PATH), { recursive: true });
  const tmp = `${LOCAL_PATH}.${process.pid}.tmp`;
  await writeFile(tmp, body, "utf8");
  await rename(tmp, LOCAL_PATH);
}

export async function loadCryptoForwardBook(): Promise<CryptoForwardLoad> {
  const storage = cryptoForwardStorageMode();
  if (storage === "unconfigured") return { status: "empty", storage };
  try {
    const text = storage === "blob" ? await readBlob() : await readLocal();
    if (text === null) return { status: "empty", storage };
    return { status: "ready", storage, book: parseStoredBook(text) };
  } catch (error) {
    console.error(
      "crypto-forward read failed",
      error instanceof Error ? error.name : "unknown",
    );
    return { status: "unavailable", storage };
  }
}

async function readBlob(): Promise<string | null> {
  const result = await get(CRYPTO_FORWARD_BLOB_PATH, {
    access: "private",
    useCache: false,
  });
  if (!result || result.statusCode !== 200) return null;
  return new Response(result.stream).text();
}

async function readLocal(): Promise<string | null> {
  try {
    return await readFile(LOCAL_PATH, "utf8");
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

function parseStoredBook(text: string): CryptoForwardBook {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new CryptoForwardStoreError(
      "Crypto forward store is not valid JSON.",
      "corrupt",
    );
  }
  const result = parseCryptoForwardBook(parsed);
  if (!result.ok) {
    throw new CryptoForwardStoreError(
      "Crypto forward store has an unexpected shape.",
      "corrupt",
    );
  }
  return result.book;
}

function isNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "ENOENT"
  );
}
