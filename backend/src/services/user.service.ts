import { db } from "../db.js";
import { logger } from "../utils/logger.js";

export class UserService {
  /**
   * Activate access for a new subscriber.
   * Called on `subscription.activated` webhook.
   * accessExpiresAt is set to the subscription's currentPeriodEnd —
   * MoonPay sends a `subscription.renewed` event each month to push it forward.
   */
  static async activateMonthlyAccess(
    userId: string,
    subscription: { subscriptionId: string; periodEnd: Date }
  ) {
    const now = new Date();
    const existing = await db.user.findUnique({ where: { id: userId } });

    if (existing) {
      logger.info("Re-activating subscription", { userId });
      return db.user.update({
        where: { id: userId },
        data: {
          subscriptionId:     subscription.subscriptionId,
          subscriptionStatus: "active",
          accessExpiresAt:    subscription.periodEnd,
          lastPaymentAt:      now,
        },
      });
    }

    logger.info("Creating new subscriber", { userId });
    return db.user.create({
      data: {
        id:                 userId,
        subscriptionId:     subscription.subscriptionId,
        subscriptionStatus: "active",
        accessExpiresAt:    subscription.periodEnd,
        lastPaymentAt:      now,
        createdAt:          now,
      },
    });
  }

  /**
   * Extend access on monthly renewal.
   * Called on `subscription.renewed` webhook — pushes accessExpiresAt forward.
   */
  static async renewMonthlyAccess(userId: string, newPeriodEnd: Date) {
    return db.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: "active",
        accessExpiresAt:    newPeriodEnd,
        lastPaymentAt:      new Date(),
      },
    });
  }

  /**
   * Mark subscription as cancelled.
   * Access continues until accessExpiresAt (current period end) — no immediate cutoff.
   */
  static async markSubscriptionCancelled(userId: string) {
    return db.user.update({
      where: { id: userId },
      data: { subscriptionStatus: "cancelled" },
    });
  }

  /**
   * Mark payment as failed.
   * Access is not immediately revoked — MoonPay will retry and send renewed/cancelled events.
   */
  static async markPaymentFailed(userId: string) {
    return db.user.update({
      where: { id: userId },
      data: { subscriptionStatus: "payment_failed" },
    });
  }

  /** Returns true if the user has a valid, non-expired access window. */
  static async hasActiveAccess(userId: string): Promise<boolean> {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user?.accessExpiresAt) return false;
    return user.accessExpiresAt > new Date();
  }

  /** Returns days remaining in the current billing period, or 0 if expired. */
  static async daysRemaining(userId: string): Promise<number> {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user?.accessExpiresAt) return 0;
    const ms = user.accessExpiresAt.getTime() - Date.now();
    return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
  }

  static async findById(id: string) {
    return db.user.findUnique({ where: { id } });
  }

  static async findByTelegramChatId(chatId: string) {
    return db.user.findUnique({ where: { telegramChatId: chatId } });
  }

  static async findByWhatsappPhoneId(phoneId: string) {
    return db.user.findUnique({ where: { whatsappPhoneId: phoneId } });
  }

  static async updateVault(userId: string, data: {
    vaultAddress: string;
    encryptedVaultBlob: string;
    owsUserToken?: string;
  }) {
    return db.user.update({
      where: { id: userId },
      data: { ...data, vaultCreatedAt: new Date() },
    });
  }

  static async claimHandle(userId: string, handle: string) {
    return db.user.update({
      where: { id: userId },
      data: { handle, ensClaimed: true },
    });
  }
}
