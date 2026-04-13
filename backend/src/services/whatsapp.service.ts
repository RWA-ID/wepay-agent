import crypto from "crypto";
import { db } from "../db.js";
import { logger } from "../utils/logger.js";
import { UserService } from "./user.service.js";

const WHATSAPP_API_BASE = "https://graph.facebook.com/v21.0";

/**
 * Verify the WhatsApp webhook challenge (GET request from Meta during setup).
 */
export function verifyWebhookChallenge(
  mode: string,
  token: string,
  challenge: string
): string | null {
  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return challenge;
  }
  return null;
}

/**
 * Verify the X-Hub-Signature-256 header on incoming WhatsApp webhooks.
 */
export function verifyWhatsAppSignature(rawBody: Buffer, signature: string): boolean {
  const expected = `sha256=${crypto
    .createHmac("sha256", process.env.WHATSAPP_ACCESS_TOKEN!)
    .update(rawBody)
    .digest("hex")}`;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function handleWhatsAppWebhook(body: WhatsAppWebhookBody): Promise<void> {
  const entry = body.entry?.[0];
  const change = entry?.changes?.[0];
  const message = change?.value?.messages?.[0];

  if (!message || message.type !== "text") return;

  const fromPhone = message.from;
  const text = message.text.body;

  const user = await UserService.findByWhatsappPhoneId(fromPhone);

  if (!user) {
    await sendWhatsAppMessage(fromPhone, "👋 Welcome to WePay! Please set up your account at wepay.eth.limo first.");
    return;
  }

  await forwardToAgent(user.id, text, fromPhone);
}

async function forwardToAgent(userId: string, message: string, replyTo: string): Promise<void> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user?.pinataAgentId) {
    await sendWhatsAppMessage(replyTo, "⚠️ Your agent is still being set up. Please try again in a moment.");
    return;
  }

  const response = await fetch(`https://agents.pinata.cloud/api/agents/${user.pinataAgentId}/message`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PINATA_JWT}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, channel: "whatsapp" }),
  });

  if (!response.ok) {
    logger.error("WhatsApp agent forwarding failed", { userId });
    await sendWhatsAppMessage(replyTo, "⚠️ Agent temporarily unavailable. Please try again.");
    return;
  }

  const { reply } = (await response.json()) as { reply: string };
  await sendWhatsAppMessage(replyTo, reply);
}

export async function sendWhatsAppMessage(to: string, text: string): Promise<void> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;

  const response = await fetch(`${WHATSAPP_API_BASE}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });

  if (!response.ok) {
    logger.error("WhatsApp send failed", { to, status: response.status });
  }
}

// WhatsApp webhook body types
type WhatsAppWebhookBody = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<{
          from: string;
          type: string;
          text: { body: string };
        }>;
      };
    }>;
  }>;
};
