import {
  createWallet,
  getWallet,
  signTransaction,
  createPolicy,
  createApiKey,
  type WalletInfo,
} from "@open-wallet-standard/core";
import { deriveUserKey } from "../utils/crypto.js";
import { UserService } from "./user.service.js";
import { logger } from "../utils/logger.js";

export type OWSPolicyInput = {
  perTxMaxUSD: number;
  categoryLimits: Array<{ category: string; maxUSD: number }>;
  approvedAddresses: string[];
  pausedUntil?: Date;
};

const VAULT_DIR = process.env.OWS_VAULT_DIR ?? `${process.env.HOME}/.ows`;

/** Derive a deterministic passphrase for a user's wallet (never stored). */
function walletPassphrase(userId: string): string {
  return deriveUserKey(userId, process.env.VAULT_ENCRYPTION_SECRET!).toString("hex");
}

export class OWSService {
  /**
   * Creates a non-custodial OWS vault for a user.
   * The wallet is encrypted at rest in OWS_VAULT_DIR using a passphrase
   * derived from userId + VAULT_ENCRYPTION_SECRET — never stored in plaintext.
   */
  static async createVault(userId: string): Promise<{ address: string; agentToken: string }> {
    logger.info("Creating OWS vault", { userId });

    const passphrase = walletPassphrase(userId);
    const wallet: WalletInfo = createWallet(userId, passphrase, 24, VAULT_DIR);

    // Find the Base (eip155:8453) account; fall back to first EVM account
    const evmAccount =
      wallet.accounts.find((a) => a.chainId === "eip155:8453") ??
      wallet.accounts.find((a) => a.chainId.startsWith("eip155")) ??
      wallet.accounts[0];

    const address = evmAccount.address;

    // Create a spending policy (agent must stay within per-tx limit)
    const policyJson = JSON.stringify({
      perTransactionMax: { amountUSD: 500, chain: "eip155:8453" },
      chainAllowlist: ["eip155:8453", "eip155:1"],
    });
    createPolicy(policyJson, VAULT_DIR);

    // Create an API key the agent uses instead of the raw passphrase
    const keyResult = createApiKey(
      `agent-${userId}`,
      [wallet.id],
      [],          // policies enforced at signing time via the wallet's policy
      passphrase,
      undefined,   // no expiry
      VAULT_DIR,
    );

    await UserService.updateVault(userId, {
      vaultAddress:       address,
      encryptedVaultBlob: wallet.id,   // store the OWS wallet ID for lookups
      owsUserToken:       keyResult.token,
    });

    logger.info("OWS vault created", { userId, address, walletId: wallet.id });
    return { address, agentToken: keyResult.token };
  }

  /**
   * Returns the WalletInfo for a user (used for signing).
   */
  static getWalletInfo(userId: string): WalletInfo {
    return getWallet(userId, VAULT_DIR);
  }

  /**
   * Signs a raw EVM transaction hex for a user.
   */
  static signTx(userId: string, txHex: string): string {
    const passphrase = walletPassphrase(userId);
    const result = signTransaction(userId, "evm", txHex, passphrase, 0, VAULT_DIR);
    return result.signature;
  }

  /**
   * Updates spending policies for a user's vault.
   */
  static async setPolicies(userId: string, input: OWSPolicyInput): Promise<void> {
    const policy = {
      perTransactionMax:  { amountUSD: input.perTxMaxUSD, chain: "eip155:8453" },
      monthlySpendLimits: input.categoryLimits.map((c) => ({
        category:     c.category,
        maxAmountUSD: c.maxUSD,
        chain:        "eip155:8453",
      })),
      approvedPayees:     input.approvedAddresses.map((address) => ({ address, chain: "eip155:8453" })),
      chainAllowlist:     ["eip155:8453", "eip155:1"],
      timeBoundAuthorization: input.pausedUntil
        ? { resumeAt: input.pausedUntil.toISOString() }
        : null,
    };
    createPolicy(JSON.stringify(policy), VAULT_DIR);
    logger.info("OWS policies updated", { userId });
  }
}
