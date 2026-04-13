import type { Request, Response, NextFunction } from "express";
import { UserService } from "../services/user.service.js";

export async function requireAccess(req: Request, res: Response, next: NextFunction) {
  const user = req.user;
  const isActive = await UserService.hasActiveAccess(user.id);

  if (!isActive) {
    const days = await UserService.daysRemaining(user.id);
    return res.status(402).json({
      success: false,
      error: {
        code: days === 0 ? "ACCESS_EXPIRED" : "ACCESS_REQUIRED",
        message:
          days === 0
            ? "Your subscription has expired. Please resubscribe to continue."
            : "Active subscription required. Subscribe at wepay.eth.limo.",
        statusCode: 402,
      },
    });
  }

  next();
}
