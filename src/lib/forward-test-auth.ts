import { timingSafeEqual } from "node:crypto";

export function forwardTestTokenConfigured(): boolean {
  return Boolean(process.env.FORWARD_TEST_TOKEN);
}

export function authorizeForwardTest(request: Request): boolean {
  const secret = process.env.FORWARD_TEST_TOKEN;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  if (!header) return false;
  const match = /^Bearer\s+(\S+)\s*$/i.exec(header);
  if (!match) return false;
  return safeEqual(match[1], secret);
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) {
    timingSafeEqual(a, a);
    return false;
  }
  return timingSafeEqual(a, b);
}
