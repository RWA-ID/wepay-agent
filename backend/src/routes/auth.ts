import { Router } from "express";
import { SiweMessage } from "siwe";
import { signJWT } from "../middleware/auth.js";

export const authRouter = Router();

/**
 * POST /auth/siwe
 * Body: { message: string, signature: string }
 * Returns: { token: string }
 *
 * Verifies a SIWE message+signature and issues a JWT for subsequent API calls.
 * Domain validation is relaxed to support IPFS gateways (wepay.eth.limo,
 * *.ipfs.io, *.pinata.cloud, localhost, etc.).
 */
authRouter.post("/siwe", async (req, res) => {
  try {
    const { message, signature } = req.body as { message?: string; signature?: string };

    if (!message || !signature) {
      return res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: "message and signature are required", statusCode: 400 },
      });
    }

    const siwe = new SiweMessage(message);
    let result: Awaited<ReturnType<typeof siwe.verify>>;
    try {
      result = await siwe.verify({ signature });
    } catch {
      return res.status(401).json({
        success: false,
        error: { code: "INVALID_SIGNATURE", message: "Signature verification failed", statusCode: 401 },
      });
    }

    if (!result.success) {
      return res.status(401).json({
        success: false,
        error: { code: "INVALID_SIGNATURE", message: "Signature verification failed", statusCode: 401 },
      });
    }

    const token = await signJWT({
      id: siwe.address.toLowerCase(),
      walletAddress: siwe.address.toLowerCase(),
    });

    return res.json({ token });
  } catch (err) {
    console.error("SIWE error:", err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Authentication failed", statusCode: 500 },
    });
  }
});
