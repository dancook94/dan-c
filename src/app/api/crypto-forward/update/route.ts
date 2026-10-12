import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { parseCryptoForwardBook } from "@/lib/crypto-forward";
import {
  CryptoForwardStoreError,
  saveCryptoForwardBook,
} from "@/lib/crypto-forward-store";
import {
  authorizeForwardTest,
  forwardTestTokenConfigured,
} from "@/lib/forward-test-auth";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 1_500_000;

export async function POST(request: Request) {
  if (!forwardTestTokenConfigured()) {
    return NextResponse.json(
      { ok: false, error: "FORWARD_TEST_TOKEN is not set." },
      { status: 503 },
    );
  }

  if (!authorizeForwardTest(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { ok: false, error: "Payload is too large." },
      { status: 413 },
    );
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not read the request body." },
      { status: 400 },
    );
  }

  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json(
      { ok: false, error: "Payload is too large." },
      { status: 413 },
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Body must be JSON." },
      { status: 400 },
    );
  }

  const parsed = parseCryptoForwardBook(body);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  try {
    await saveCryptoForwardBook(parsed.book);
    revalidatePath("/crypto-forward-test");
    revalidatePath("/api/crypto-forward/summary");
    return NextResponse.json({ ok: true, updatedAt: parsed.book.updatedAt });
  } catch (error) {
    if (error instanceof CryptoForwardStoreError) {
      const status = error.code === "unconfigured" ? 503 : 500;
      return NextResponse.json({ ok: false, error: error.message }, { status });
    }
    console.error(
      "crypto-forward write failed",
      error instanceof Error ? error.name : "unknown",
    );
    return NextResponse.json(
      { ok: false, error: "Could not store the snapshot." },
      { status: 500 },
    );
  }
}
