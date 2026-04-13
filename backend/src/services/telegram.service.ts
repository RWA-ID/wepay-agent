import TelegramBot from "node-telegram-bot-api";
import { db } from "../db.js";
import { logger } from "../utils/logger.js";
import { UserService } from "./user.service.js";

let bot: TelegramBot;

export function initTelegramBot() {
  bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: false });
  const webhookUrl = `${process.env.API_BASE_URL}/webhooks/telegram`;
  bot.setWebHook(webhookUrl);
  logger.info("Telegram webhook set", { url: webhookUrl });
}

export async function handleTelegramWebhook(update: TelegramBot.Update): Promise<void> {
  const message = update.message;
  if (!message?.text) return;

  const chatId = message.chat.id;
  const text = message.text.trim();

  const user = await UserService.findByTelegramChatId(chatId.toString());

  if (!user) {
    // Link flow: user must send /start <linkToken>
    if (text.startsWith("/start ")) {
      const linkToken = text.replace("/start ", "").trim();
      await linkTelegramAccount(linkToken, chatId.toString());
    } else {
      await bot.sendMessage(
        chatId,
        "👋 Welcome to WePay! To connect your account, click the link in your dashboard or visit wepay.eth.limo."
      );
    }
    return;
  }

  // Forward the message to the user's Pinata agent
  await forwardToAgent(user.id, text, chatId.toString(), "telegram");
}

async function linkTelegramAccount(linkToken: string, chatId: string): Promise<void> {
  const tokenRecord = await db.telegramLinkToken.findUnique({ where: { token: linkToken } });

  if (!tokenRecord || tokenRecord.expiresAt < new Date() || tokenRecord.usedAt) {
    await bot.sendMessage(
      parseInt(chatId, 10),
      "❌ This link has expired or is invalid. Please generate a new one from your dashboard."
    );
    return;
  }

  await db.telegramLinkToken.update({ where: { token: linkToken }, data: { usedAt: new Date() } });
  await db.user.update({ where: { id: tokenRecord.userId }, data: { telegramChatId: chatId } });

  logger.info("Telegram account linked", { userId: tokenRecord.userId, chatId });

  await bot.sendMessage(
    parseInt(chatId, 10),
    "✅ Your WePay agent is connected!\n\nTry:\n• \"What's my balance?\"\n• \"Pay the light bill\"\n• \"Show this month's spending\""
  );
}

async function forwardToAgent(userId: string, message: string, chatId: string, channel: string): Promise<void> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user?.pinataAgentId) {
    await bot.sendMessage(parseInt(chatId, 10), "⚠️ Your agent is still being set up. Please try again in a moment.");
    return;
  }

  const response = await fetch(`https://agents.pinata.cloud/v0/agents/${user.pinataAgentId}/message`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PINATA_JWT}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, channel }),
  });

  if (!response.ok) {
    logger.error("Agent message forwarding failed", { userId, status: response.status });
    await bot.sendMessage(parseInt(chatId, 10), "⚠️ Agent temporarily unavailable. Please try again.");
    return;
  }

  const { reply } = (await response.json()) as { reply: string };
  await bot.sendMessage(parseInt(chatId, 10), reply, { parse_mode: "Markdown" });
}

/** Generate a one-time Telegram deep link for connecting an account. */
export async function generateTelegramLink(userId: string): Promise<string> {
  const token = crypto.randomUUID().replace(/-/g, "");
  await db.telegramLinkToken.create({
    data: {
      token,
      userId,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min expiry
    },
  });

  const botUsername = process.env.TELEGRAM_BOT_USERNAME!;
  return `https://t.me/${botUsername}?start=${token}`;
}

export function getBotInstance() {
  return bot;
}
