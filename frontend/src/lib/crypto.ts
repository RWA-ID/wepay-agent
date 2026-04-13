/**
 * Client-side AES-256-GCM decryption for vault seed phrases.
 * The key is derived from the user's wallet signature over a fixed message.
 * This ensures only the user (with their private key) can decrypt their seed.
 *
 * Note: This is a placeholder implementation. In production, the decryption
 * key should be derived from a wallet signature, not stored in browser memory.
 */

export async function deriveKeyFromSignature(signature: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(signature),
    "HKDF",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      salt: encoder.encode("wepay-vault-salt-v1"),
      info: encoder.encode("wepay-vault-key"),
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
}

export async function decrypt(ciphertext: string, key: CryptoKey): Promise<string> {
  const data = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
  const iv      = data.slice(0, 12);
  const payload = data.slice(28);  // 12 (iv) + 16 (authTag) offset
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, payload);
  return new TextDecoder().decode(decrypted);
}
