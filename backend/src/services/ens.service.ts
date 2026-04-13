import { createPublicClient, createWalletClient, http } from "viem";
import { mainnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { namehash, labelhash } from "viem/ens";
import { logger } from "../utils/logger.js";

const WEPAY_REGISTRAR_ABI = [
  {
    name: "isAvailable",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "handle", type: "string" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "claimSubdomain",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "handle", type: "string" },
      { name: "owsVaultAddress", type: "address" },
    ],
    outputs: [],
  },
] as const;

const WEPAY_REGISTRAR_ADDRESS = process.env.WEPAY_REGISTRAR_ADDRESS as `0x${string}` | undefined;

export const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(process.env.ETH_RPC_URL),
});

function getWalletClient() {
  const pk = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;
  const account = privateKeyToAccount(pk);
  return createWalletClient({ account, chain: mainnet, transport: http(process.env.ETH_RPC_URL) });
}

export class ENSService {
  /**
   * Check if a handle is available on-chain via the registrar contract.
   */
  static async isAvailable(handle: string): Promise<boolean> {
    if (!WEPAY_REGISTRAR_ADDRESS) throw new Error("WEPAY_REGISTRAR_ADDRESS not set");

    return publicClient.readContract({
      address: WEPAY_REGISTRAR_ADDRESS,
      abi: WEPAY_REGISTRAR_ABI,
      functionName: "isAvailable",
      args: [handle],
    });
  }

  /**
   * Relay a subdomain claim on behalf of the user.
   * In a gas-sponsored flow, the backend submits the tx so the user pays no gas.
   * In a self-pay flow, this is called directly from the frontend wallet.
   */
  static async claimSubdomain(handle: string, owsVaultAddress: `0x${string}`) {
    if (!WEPAY_REGISTRAR_ADDRESS) throw new Error("WEPAY_REGISTRAR_ADDRESS not set");

    const walletClient = getWalletClient();

    logger.info("Relaying subdomain claim", { handle, owsVaultAddress });

    const hash = await walletClient.writeContract({
      address: WEPAY_REGISTRAR_ADDRESS,
      abi: WEPAY_REGISTRAR_ABI,
      functionName: "claimSubdomain",
      args: [handle, owsVaultAddress],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    logger.info("Subdomain claimed", { handle, txHash: hash, block: receipt.blockNumber });

    return { txHash: hash, blockNumber: receipt.blockNumber };
  }

  /** Compute the ENS node for a subdomain (useful for frontend) */
  static computeSubnodeHash(handle: string): `0x${string}` {
    const wePayNode = "0x783b76a8de513b3731a5998d7770987e5ff5aaa322aee1871ad6b16b0a561861" as `0x${string}`;
    const label = labelhash(handle) as `0x${string}`;
    // keccak256(parentNode + labelhash)
    const encoder = new TextEncoder();
    // viem's namehash handles this via the ENS standard
    return namehash(`${handle}.wepay.eth`);
  }
}
