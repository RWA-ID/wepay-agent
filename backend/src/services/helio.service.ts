import crypto from "crypto";

/**
 * Verifies a Helio webhook request.
 *
 * Helio sends two auth mechanisms on every webhook:
 *   1. Authorization: Bearer <sharedToken>   — confirms origin is Helio
 *   2. X-Signature: <hmac-sha256-hex>        — HMAC-SHA256(rawBody, sharedToken) as hex
 *
 * Both must match the HELIO_WEBHOOK_SECRET from .env.
 */
export function verifyHelioWebhook(
  rawBody: Buffer,
  authHeader: string | undefined,
  signatureHeader: string | undefined
): boolean {
  const secret = process.env.HELIO_WEBHOOK_SECRET;
  if (!secret) return false;

  // 1. Bearer token check
  const expectedBearer = `Bearer ${secret}`;
  if (!authHeader || authHeader !== expectedBearer) return false;

  // 2. HMAC-SHA256 signature check
  if (!signatureHeader) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signatureHeader, "hex")
    );
  } catch {
    return false;
  }
}
