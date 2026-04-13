import { Router, type Request, type Response } from "express";
import { generateTelegramLink } from "../services/telegram.service.js";
import { db } from "../db.js";
import { logger } from "../utils/logger.js";

export const messagingRouter = Router();

/** GET /messaging/status — Check connection status for all channels */
messagingRouter.get("/status", async (req: Request, res: Response) => {
  const user = await db.user.findUnique({
    where: { id: req.user.id },
    select: { telegramChatId: true, whatsappPhoneId: true },
  });

  res.json({
    success: true,
    data: {
      telegram: { connected: !!user?.telegramChatId },
      whatsapp: { connected: !!user?.whatsappPhoneId },
    },
  });
});

/** POST /messaging/telegram/link — Generate a one-time Telegram deep link */
messagingRouter.post("/telegram/link", async (req: Request, res: Response) => {
  try {
    const link = await generateTelegramLink(req.user.id);
    res.json({ success: true, data: { link, expiresInMinutes: 15 } });
  } catch (err) {
    logger.error("Telegram link generation failed", { userId: req.user.id, err });
    res.status(500).json({
      success: false,
      error: { code: "LINK_FAILED", message: "Failed to generate Telegram link", statusCode: 500 },
    });
  }
});

/** DELETE /messaging/telegram — Disconnect Telegram */
messagingRouter.delete("/telegram", async (req: Request, res: Response) => {
  await db.user.update({
    where: { id: req.user.id },
    data: { telegramChatId: null },
  });
  res.json({ success: true, data: null });
});

/** DELETE /messaging/whatsapp — Disconnect WhatsApp */
messagingRouter.delete("/whatsapp", async (req: Request, res: Response) => {
  await db.user.update({
    where: { id: req.user.id },
    data: { whatsappPhoneId: null },
  });
  res.json({ success: true, data: null });
});
