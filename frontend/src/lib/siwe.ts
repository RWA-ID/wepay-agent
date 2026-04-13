import { SiweMessage } from "siwe";
import type { WalletClient } from "viem";

/**
 * Constructs and signs a SIWE message, then exchanges it with the backend
 * for a JWT session token.
 */
export async function signInWithEthereum(
  walletClient: WalletClient,
  address: `0x${string}`,
  chainId: number
): Promise<string> {
  const nonce = crypto.randomUUID().replace(/-/g, "").slice(0, 16);

  const message = new SiweMessage({
    domain: typeof window !== "undefined" ? window.location.host : "wepay.eth.limo",
    address,
    statement: "Sign in to WePay — your personal AI payment agent.",
    uri: typeof window !== "undefined" ? window.location.origin : "https://wepay.eth.limo",
    version: "1",
    chainId,
    nonce,
    issuedAt: new Date().toISOString(),
  });

  const messageStr = message.prepareMessage();
  const signature = await walletClient.signMessage({ account: address, message: messageStr });

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/siwe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: messageStr, signature }),
  });

  if (!res.ok) {
    throw new Error("SIWE authentication failed");
  }

  const { token } = await res.json();
  return token as string;
}
