import { PinataSDK } from "pinata";
import { encrypt, decrypt, deriveUserKey } from "./crypto.js";

export const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.PINATA_GATEWAY!,
});

/**
 * Pin encrypted JSON data to IPFS under a user-specific key.
 * All user data is encrypted before leaving the server.
 * Returns the IPFS CID.
 */
export async function pinUserData(userId: string, dataType: string, data: unknown): Promise<string> {
  const key = deriveUserKey(userId, process.env.VAULT_ENCRYPTION_SECRET!);
  const encrypted = encrypt(JSON.stringify(data), key);
  const file = new File([encrypted], `${userId}-${dataType}.json`, { type: "application/json" });
  const result = await pinata.upload.public.file(file, {
    metadata: {
      name: `wepay-${userId}-${dataType}`,
      keyvalues: { userId, dataType },
    },
  });
  return result.cid;
}

/**
 * Fetch and decrypt user data from IPFS by CID.
 */
export async function fetchUserData<T>(userId: string, cid: string): Promise<T> {
  const response = await pinata.gateways.get(cid);
  const key = deriveUserKey(userId, process.env.VAULT_ENCRYPTION_SECRET!);
  const decrypted = decrypt(response as string, key);
  return JSON.parse(decrypted) as T;
}
