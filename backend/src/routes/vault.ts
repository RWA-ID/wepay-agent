import { Router, type Request, type Response } from "express";
import { OWSService, type OWSPolicyInput } from "../services/ows.service.js";
import { logger } from "../utils/logger.js";

export const vaultRouter = Router();

/** GET /vault — Get vault info (address, creation date) */
vaultRouter.get("/", async (req: Request, res: Response) => {
  const { db } = await import("../db.js");
  const user = await db.user.findUnique({
    where: { id: req.user.id },
    select: { vaultAddress: true, vaultCreatedAt: true, handle: true },
  });

  res.json({ success: true, data: user });
});

/** POST /vault/create — Create OWS vault (called once after subscription) */
vaultRouter.post("/create", async (req: Request, res: Response) => {
  const { db } = await import("../db.js");
  const user = await db.user.findUnique({ where: { id: req.user.id } });

  if (user?.vaultAddress) {
    return res.status(409).json({
      success: false,
      error: { code: "VAULT_EXISTS", message: "Vault already created", statusCode: 409 },
    });
  }

  try {
    const { address, encryptedSeed } = await OWSService.createVault(req.user.id);

    // The encrypted seed is returned ONCE — the client must show it to the user
    // and confirm they've saved it. After this response, it is not stored server-side.
    res.json({ success: true, data: { address, encryptedSeed, oneTimeDelivery: true } });
  } catch (err) {
    logger.error("Vault creation failed", { userId: req.user.id, err });
    res.status(500).json({
      success: false,
      error: { code: "VAULT_CREATION_FAILED", message: "Failed to create vault", statusCode: 500 },
    });
  }
});

/** POST /vault/policies — Set spending policies */
vaultRouter.post("/policies", async (req: Request, res: Response) => {
  const input = req.body as OWSPolicyInput;

  try {
    await OWSService.setPolicies(req.user.id, input);
    res.json({ success: true, data: { message: "Policies updated" } });
  } catch (err) {
    logger.error("Policy update failed", { userId: req.user.id, err });
    res.status(500).json({
      success: false,
      error: { code: "POLICY_UPDATE_FAILED", message: "Failed to update policies", statusCode: 500 },
    });
  }
});
