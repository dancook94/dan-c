import { NextResponse } from "next/server";
import { loadCryptoForwardBook } from "@/lib/crypto-forward-store";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET() {
  const loaded = await loadCryptoForwardBook();
  if (loaded.status === "unavailable") {
    return NextResponse.json(
      { ok: false, error: "Could not read the crypto forward book." },
      { status: 500 },
    );
  }
  if (loaded.status === "empty") {
    return NextResponse.json(
      { empty: true },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300",
        },
      },
    );
  }
  return NextResponse.json(loaded.book, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300",
    },
  });
}
