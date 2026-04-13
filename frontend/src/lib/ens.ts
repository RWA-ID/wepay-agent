import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { normalize, namehash } from "viem/ens";

const client = createPublicClient({
  chain: mainnet,
  transport: http(`https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY ?? ""}`),
});

/**
 * Resolve the ETH address for an ENS name.
 */
export async function resolveAddress(name: string): Promise<`0x${string}` | null> {
  try {
    const address = await client.getEnsAddress({ name: normalize(name) });
    return address ?? null;
  } catch {
    return null;
  }
}

/**
 * Reverse-resolve a wallet address to its primary ENS name.
 */
export async function resolveEnsName(address: `0x${string}`): Promise<string | null> {
  try {
    return await client.getEnsName({ address });
  } catch {
    return null;
  }
}

export { namehash, normalize };
