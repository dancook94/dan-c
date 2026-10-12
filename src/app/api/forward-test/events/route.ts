import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  authorizeForwardTest,
  forwardTestTokenConfigured,
} from "@/lib/forward-test-auth";
import {
  ForwardTestCapacityError,
  parseForwardTestEvent,
  type ForwardTestEvent,
} from "@/lib/forward-test";
import {
  ForwardTestStoreError,
  upsertForwardTestEvent,
} from "@/lib/forward-test-store";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 32_000;
const SECRET_ENV_KEYS = ["BLOB_READ_WRITE_TOKEN", "FORWARD_TEST_TOKEN"] as const;

function loggedErrorParts(error: unknown): [string, string] {
  if (!(error instanceof Error)) return ["unknown", "unknown"];
  return [error.constructor.name, redactSecrets(error.message)];
}

function redactSecrets(message: string): string {
  let safe = message;
  for (const key of SECRET_ENV_KEYS) {
    const secret = process.env[key];
    if (secret) safe = safe.split(secret).join("[redacted]");
  }
  return safe;
}

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

  const parsed = parseForwardTestEvent(body);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const event: ForwardTestEvent = {
    ...parsed.event,
    receivedAt: new Date().toISOString(),
  };

  try {
    const saved = await upsertForwardTestEvent(event);
    revalidatePath("/forward-test");
    revalidatePath("/api/forward-test/summary");
    return NextResponse.json({
      ok: true,
      id: event.id,
      type: event.type,
      created: saved.created,
    });
  } catch (error) {
    if (error instanceof ForwardTestCapacityError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 503 });
    }
    if (error instanceof ForwardTestStoreError) {
      const status = error.code === "sample" ? 400 : 503;
      return NextResponse.json({ ok: false, error: error.message }, { status });
    }
    console.error("forward-test write failed", ...loggedErrorParts(error));
    return NextResponse.json(
      { ok: false, error: "Could not store the event." },
      { status: 503 },
    );
  }
}
