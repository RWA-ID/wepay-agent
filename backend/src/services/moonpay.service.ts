import crypto from "crypto";

/**
 * Verifies a MoonPay onramp webhook signature.
 * MoonPay signs the raw body with HMAC-SHA256 and base64-encodes the result.
 * The signature is in the `moonpay-signature-v2` header.
 */
export function verifyMoonPaySignature(rawBody: Buffer, signature: string): boolean {
  const hmac = crypto.createHmac("sha256", process.env.MOONPAY_SECRET_KEY!);
  const digest = hmac.update(rawBody).digest("base64");
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

/**
 * Build a signed MoonPay widget URL for one-off onramp (vault funding, not subscription).
 * Subscription checkout uses createSubscription() instead.
 */
export function buildOnrampUrl(walletAddress: string, amount?: string): string {
  const params = new URLSearchParams({
    apiKey:           process.env.MOONPAY_PUBLISHABLE_KEY!,
    currencyCode:     "usdc_base",
    baseCurrencyCode: "usd",
    walletAddress,
    colorCode: "%237C3AED",
    theme:     "dark",
    language:  "en",
    ...(amount ? { baseCurrencyAmount: amount } : {}),
  });

  const queryString = params.toString();

  // Sign the URL with the secret key
  const sig = crypto
    .createHmac("sha256", process.env.MOONPAY_SECRET_KEY!)
    .update(`?${queryString}`)
    .digest("base64");
  params.set("signature", sig);

  return `https://buy.moonpay.com?${params.toString()}`;
}

