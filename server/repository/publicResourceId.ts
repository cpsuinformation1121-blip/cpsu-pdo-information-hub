import { createCipheriv, createDecipheriv, createHmac } from "node:crypto";
import type { R2Config } from "../config/r2.ts";

const version = "v1_";

function deriveKey(config: R2Config) {
  return createHmac("sha256", config.secretAccessKey)
    .update(`cpsu-public-resource-id:${config.accountId}:${config.bucketName}`)
    .digest();
}

export function createPublicResourceId(key: string, config: R2Config) {
  const encryptionKey = deriveKey(config);
  const nonce = createHmac("sha256", encryptionKey).update(key).digest().subarray(0, 12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey, nonce);
  const ciphertext = Buffer.concat([cipher.update(key, "utf8"), cipher.final()]);
  return version + Buffer.concat([nonce, cipher.getAuthTag(), ciphertext]).toString("base64url");
}

export function decodePublicResourceId(id: string, config: R2Config): string | null {
  if (!/^v1_[A-Za-z0-9_-]{40,6000}$/u.test(id)) return null;

  try {
    const bytes = Buffer.from(id.slice(version.length), "base64url");
    if (bytes.length < 29) return null;
    const encryptionKey = deriveKey(config);
    const nonce = bytes.subarray(0, 12);
    const tag = bytes.subarray(12, 28);
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey, nonce);
    decipher.setAuthTag(tag);
    const key = Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString("utf8");
    const expectedNonce = createHmac("sha256", encryptionKey).update(key).digest().subarray(0, 12);
    return nonce.equals(expectedNonce) ? key : null;
  } catch {
    return null;
  }
}
