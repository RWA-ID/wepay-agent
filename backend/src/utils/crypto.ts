import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

/**
 * AES-256-GCM encrypt.
 * Returns base64-encoded string: iv(12) + authTag(16) + ciphertext
 */
export function encrypt(plaintext: string, key: Buffer): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

/**
 * AES-256-GCM decrypt.
 * Expects base64-encoded string from `encrypt()`.
 */
export function decrypt(ciphertext: string, key: Buffer): string {
  const data = Buffer.from(ciphertext, "base64");
  const iv      = data.subarray(0, 12);
  const authTag = data.subarray(12, 28);
  const payload = data.subarray(28);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(payload).toString("utf8") + decipher.final("utf8");
}

/**
 * Derives a 32-byte key for a specific user using scrypt.
 * userId + appSecret → deterministic key.
 * The key is stable across restarts as long as VAULT_ENCRYPTION_SECRET stays the same.
 */
export function deriveUserKey(userId: string, appSecret: string): Buffer {
  return crypto.scryptSync(`${userId}:${appSecret}`, "wepay-vault-salt-v1", 32);
}
