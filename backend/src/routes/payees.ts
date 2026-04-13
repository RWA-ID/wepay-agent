import { Router, type Request, type Response } from "express";
import { db } from "../db.js";
import { logger } from "../utils/logger.js";

export const payeesRouter = Router();

/** GET /payees — List user's payees */
payeesRouter.get("/", async (req: Request, res: Response) => {
  const payees = await db.payee.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
  });
  res.json({ success: true, data: payees });
});

/** POST /payees — Add a payee */
payeesRouter.post("/", async (req: Request, res: Response) => {
  const { name, address, category, typicalAmount, currency, chain, notes } = req.body;

  if (!name || !address || !category) {
    return res.status(400).json({
      success: false,
      error: { code: "MISSING_FIELDS", message: "name, address, and category are required", statusCode: 400 },
    });
  }

  const payee = await db.payee.create({
    data: {
      userId: req.user.id,
      name,
      address,
      category,
      typicalAmount: typicalAmount ? parseFloat(typicalAmount) : null,
      currency: currency ?? "USDC",
      chain: chain ?? "eip155:8453",
      notes,
    },
  });

  logger.info("Payee added", { userId: req.user.id, payeeId: payee.id });
  res.status(201).json({ success: true, data: payee });
});

/** PUT /payees/:id — Update a payee */
payeesRouter.put("/:id", async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const payee = await db.payee.findFirst({
    where: { id, userId: req.user.id },
  });

  if (!payee) {
    return res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Payee not found", statusCode: 404 },
    });
  }

  const updated = await db.payee.update({
    where: { id },
    data: req.body,
  });

  res.json({ success: true, data: updated });
});

/** DELETE /payees/:id — Delete a payee */
payeesRouter.delete("/:id", async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const payee = await db.payee.findFirst({
    where: { id, userId: req.user.id },
  });

  if (!payee) {
    return res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Payee not found", statusCode: 404 },
    });
  }

  await db.payee.delete({ where: { id } });
  res.json({ success: true, data: null });
});
