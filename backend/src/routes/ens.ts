import { Router, type Request, type Response } from "express";
import { ENSService } from "../services/ens.service.js";
import { UserService } from "../services/user.service.js";
import { subdomainClaimRateLimit } from "../middleware/rateLimit.js";
import { logger } from "../utils/logger.js";

export const ensRouter = Router();

/** GET /ens/check?handle=alice — Check if a handle is available */
ensRouter.get("/check", async (req: Request, res: Response) => {
  const handle = (req.query.handle as string)?.toLowerCase();
  if (!handle || handle.length < 3) {
    return res.status(400).json({
      success: false,
      error: { code: "INVALID_HANDLE", message: "Handle must be at least 3 characters", statusCode: 400 },
    });
  }

  try {
    const available = await ENSService.isAvailable(handle);
    res.json({ success: true, data: { handle, available } });
  } catch (err) {
    logger.error("ENS availability check failed", { handle, err });
    res.status(500).json({
      success: false,
      error: { code: "CHECK_FAILED", message: "Failed to check availability", statusCode: 500 },
    });
  }
});

/** POST /ens/claim — Relay subdomain claim (gas-sponsored) */
ensRouter.post("/claim", subdomainClaimRateLimit, async (req: Request, res: Response) => {
  const { handle, owsVaultAddress } = req.body as { handle: string; owsVaultAddress: string };

  if (!handle || !owsVaultAddress) {
    return res.status(400).json({
      success: false,
      error: { code: "MISSING_PARAMS", message: "handle and owsVaultAddress required", statusCode: 400 },
    });
  }

  // Ensure user has a vault before claiming
  const user = await UserService.findById(req.user.id);
  if (!user?.vaultAddress) {
    return res.status(400).json({
      success: false,
      error: { code: "NO_VAULT", message: "Create your vault before claiming a subdomain", statusCode: 400 },
    });
  }

  // Ensure vault address matches
  if (user.vaultAddress.toLowerCase() !== owsVaultAddress.toLowerCase()) {
    return res.status(400).json({
      success: false,
      error: { code: "ADDRESS_MISMATCH", message: "owsVaultAddress must match your vault", statusCode: 400 },
    });
  }

  try {
    const result = await ENSService.claimSubdomain(handle.toLowerCase(), owsVaultAddress as `0x${string}`);
    await UserService.claimHandle(req.user.id, handle.toLowerCase());

    res.json({
      success: true,
      data: {
        handle: handle.toLowerCase(),
        subdomain: `${handle.toLowerCase()}.wepay.eth`,
        txHash: result.txHash,
      },
    });
  } catch (err) {
    logger.error("ENS subdomain claim failed", { userId: req.user.id, handle, err });
    res.status(500).json({
      success: false,
      error: { code: "CLAIM_FAILED", message: "Subdomain claim failed", statusCode: 500 },
    });
  }
});
