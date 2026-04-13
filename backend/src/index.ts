import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { webhookRouter } from "./routes/webhooks.js";
import { vaultRouter } from "./routes/vault.js";
import { ensRouter } from "./routes/ens.js";
import { payeesRouter } from "./routes/payees.js";
import { agentsRouter } from "./routes/agents.js";
import { messagingRouter } from "./routes/messaging.js";
import { authMiddleware } from "./middleware/auth.js";
import { requireAccess } from "./middleware/subscription.js";
import { globalRateLimit } from "./middleware/rateLimit.js";
import { logger } from "./utils/logger.js";
import { initTelegramBot } from "./services/telegram.service.js";

const app = express();
const PORT = process.env.PORT ?? 3001;

// Trust Railway/proxy headers for rate limiting and IP detection
app.set("trust proxy", 1);

// ── Security middleware ────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL ?? "*", credentials: true }));
app.use(globalRateLimit);

// ── Raw body for webhook signature verification ────────────────────────────
app.use("/webhooks", express.raw({ type: "application/json" }));

// ── JSON body for all other routes ────────────────────────────────────────
app.use(express.json());

// ── Public routes (no auth required) ──────────────────────────────────────
app.use("/webhooks", webhookRouter);

// ── Authenticated routes ───────────────────────────────────────────────────
app.use("/vault", authMiddleware, requireAccess, vaultRouter);
app.use("/ens", authMiddleware, requireAccess, ensRouter);
app.use("/payees", authMiddleware, requireAccess, payeesRouter);
app.use("/agents", authMiddleware, requireAccess, agentsRouter);
app.use("/messaging", authMiddleware, requireAccess, messagingRouter);

// ── Health check ───────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// ── 404 ────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Route not found", statusCode: 404 } });
});

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`WePay API running on port ${PORT}`);
  if (process.env.TELEGRAM_BOT_TOKEN) {
    initTelegramBot();
    logger.info("Telegram bot initialized");
  }
});

export default app;
