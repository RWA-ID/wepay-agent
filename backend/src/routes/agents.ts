import { Router, type Request, type Response } from "express";
import { PinataAgentService } from "../services/pinata.service.js";
import { db } from "../db.js";
import { logger } from "../utils/logger.js";

export const agentsRouter = Router();

/** GET /agents/status — Check agent provisioning status */
agentsRouter.get("/status", async (req: Request, res: Response) => {
  const user = await db.user.findUnique({
    where: { id: req.user.id },
    select: { pinataAgentId: true },
  });

  res.json({
    success: true,
    data: {
      provisioned: !!user?.pinataAgentId,
      agentId: user?.pinataAgentId ?? null,
    },
  });
});

/** POST /agents/provision — Manually trigger agent provisioning */
agentsRouter.post("/provision", async (req: Request, res: Response) => {
  const user = await db.user.findUnique({ where: { id: req.user.id } });

  if (user?.pinataAgentId) {
    return res.json({
      success: true,
      data: { agentId: user.pinataAgentId, message: "Agent already provisioned" },
    });
  }

  try {
    const { agentId } = await PinataAgentService.provisionAgent(req.user.id);
    res.json({ success: true, data: { agentId } });
  } catch (err) {
    logger.error("Agent provisioning failed", { userId: req.user.id, err });
    res.status(500).json({
      success: false,
      error: { code: "PROVISION_FAILED", message: "Agent provisioning failed", statusCode: 500 },
    });
  }
});
