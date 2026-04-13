import rateLimit from "express-rate-limit";

export const globalRateLimit = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many requests", statusCode: 429 } },
});

/** Strict limit for webhook endpoints — 10 req/min */
export const webhookRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many webhook requests", statusCode: 429 } },
});

/** Per-user agent message relay — 60 req/min */
export const agentMessageRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: (req) => req.user?.id ?? req.ip ?? "unknown",
  standardHeaders: true,
  legacyHeaders: false,
});

/** Subdomain claim — 3 req/hour per IP */
export const subdomainClaimRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many subdomain claim attempts", statusCode: 429 } },
});
