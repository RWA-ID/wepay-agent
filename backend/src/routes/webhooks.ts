import { Router, type Request, type Response } from "express";
import { verifyHelioWebhook } from "../services/helio.service.js";
import { verifyMoonPaySignature } from "../services/moonpay.service.js";
import { UserService } from "../services/user.service.js";
import { OWSService } from "../services/ows.service.js";
import { PinataAgentService } from "../services/pinata.service.js";
import { handleTelegramWebhook } from "../services/telegram.service.js";
import { handleWhatsAppWebhook, verifyWebhookChallenge, verifyWhatsAppSignature } from "../services/whatsapp.service.js";
import { webhookRateLimit } from "../middleware/rateLimit.js";
import { logger } from "../utils/logger.js";

export const webhookRouter = Router();

webhookRouter.use(webhookRateLimit);

// ── Helio subscription webhook ─────────────────────────────────────────────
//
// Events:
//   SUBSCRIPTION_STARTED       — new subscriber, provision vault + agent
//   SUBSCRIPTION_PENDING_PAYMENT — renewal payment received
//   SUBSCRIPTION_ENDED         — subscription ended (cancelled or lapsed)
//
// Helio passes the userId we set as `externalId` in the checkout widget.
// It arrives in the webhook as transactionObject.meta.customerExternalId.
//
// NOTE: If externalId doesn't appear at that path after live testing, check:
//   - top-level `customerId` field
//   - transactionObject.meta.externalId
// and adjust the line marked TODO below.

webhookRouter.post("/helio", async (req: Request, res: Response) => {
  const auth      = req.headers["authorization"] as string | undefined;
  const signature = req.headers["x-signature"]   as string | undefined;

  if (!verifyHelioWebhook(req.body as Buffer, auth, signature)) {
    logger.warn("Helio webhook auth/signature verification failed");
    return res.status(401).json({ error: "Unauthorized" });
  }

  let event: HelioWebhookEvent;
  try {
    event = JSON.parse((req.body as Buffer).toString("utf8"));
  } catch {
    return res.status(400).json({ error: "Invalid JSON payload" });
  }

  // TODO: confirm exact path after first live event — check webhook logs in Helio dashboard
  const userId = event.transactionObject?.meta?.customerExternalId;
  if (!userId) {
    logger.error("Helio webhook missing customerExternalId", { eventType: event.event });
    return res.json({ received: true });
  }

  try {
    switch (event.event) {

      case "SUBSCRIPTION_STARTED": {
        // New subscriber — grant access for 30 days and provision their stack
        const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const user = await UserService.activateMonthlyAccess(userId, {
          subscriptionId: event.subscriptionId ?? userId,
          periodEnd,
        });

        if (!user.vaultAddress) {
          await OWSService.createVault(userId);
        }
        if (!user.pinataAgentId) {
          await PinataAgentService.provisionAgent(userId);
        }

        logger.info("Helio subscription started", { userId, periodEnd });
        break;
      }

      case "SUBSCRIPTION_PENDING_PAYMENT": {
        // Monthly renewal — extend access by another 30 days
        const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await UserService.renewMonthlyAccess(userId, periodEnd);
        logger.info("Helio subscription renewed", { userId, periodEnd });
        break;
      }

      case "SUBSCRIPTION_ENDED": {
        // Subscription ended — mark cancelled, access lapses at accessExpiresAt naturally
        await UserService.markSubscriptionCancelled(userId);
        logger.info("Helio subscription ended", { userId });
        break;
      }

      default:
        logger.debug("Unhandled Helio webhook event", { type: event.event });
    }
  } catch (err) {
    logger.error("Helio webhook processing error", { userId, eventType: event.event, err });
    // Return 200 so Helio does not retry for non-transient errors
  }

  res.json({ received: true });
});

// ── MoonPay onramp webhook (vault funding — not subscriptions) ─────────────

webhookRouter.post("/moonpay", async (req: Request, res: Response) => {
  const signature = req.headers["moonpay-signature-v2"] as string;

  if (!signature) {
    return res.status(401).json({ error: "Missing signature header" });
  }

  if (!verifyMoonPaySignature(req.body as Buffer, signature)) {
    logger.warn("MoonPay webhook signature verification failed");
    return res.status(401).json({ error: "Invalid signature" });
  }

  let event: MoonPayWebhookEvent;
  try {
    event = JSON.parse((req.body as Buffer).toString("utf8"));
  } catch {
    return res.status(400).json({ error: "Invalid JSON payload" });
  }

  // Handle onramp events here as needed (e.g. transaction.completed)
  logger.debug("MoonPay webhook event", { type: event.type });

  res.json({ received: true });
});

// ── Telegram webhook ───────────────────────────────────────────────────────

webhookRouter.post("/telegram", async (req: Request, res: Response) => {
  try {
    await handleTelegramWebhook(req.body);
  } catch (err) {
    logger.error("Telegram webhook error", { err });
  }
  res.json({ ok: true });
});

// ── WhatsApp webhook (verification + messages) ─────────────────────────────

webhookRouter.get("/whatsapp", (req: Request, res: Response) => {
  const { "hub.mode": mode, "hub.verify_token": token, "hub.challenge": challenge } = req.query as Record<string, string>;
  const result = verifyWebhookChallenge(mode, token, challenge);
  if (result) {
    res.status(200).send(result);
  } else {
    res.status(403).send("Forbidden");
  }
});

webhookRouter.post("/whatsapp", async (req: Request, res: Response) => {
  const signature = req.headers["x-hub-signature-256"] as string;

  if (!signature || !verifyWhatsAppSignature(req.body as Buffer, signature)) {
    logger.warn("WhatsApp webhook signature verification failed");
    return res.status(401).json({ error: "Invalid signature" });
  }

  let body: unknown;
  try {
    body = JSON.parse((req.body as Buffer).toString("utf8"));
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  try {
    await handleWhatsAppWebhook(body as Parameters<typeof handleWhatsAppWebhook>[0]);
  } catch (err) {
    logger.error("WhatsApp webhook error", { err });
  }

  res.json({ ok: true });
});

// ── Types ──────────────────────────────────────────────────────────────────

type HelioWebhookEvent = {
  event:          string;
  email?:         string;
  subscriptionId?: string;
  subscriptionState?: string;
  transactionObject?: {
    id:          string;
    paylinkId:   string;
    paymentType: string;
    createdAt:   string;
    meta?: {
      customerExternalId?: string;  // userId we pass as externalId in checkout
      transactionStatus?:  string;
      transactionType?:    string;
      [key: string]: unknown;
    };
  };
};

type MoonPayWebhookEvent = {
  type: string;
  data?: Record<string, unknown>;
};
