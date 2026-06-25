import crypto from 'crypto';

export function generateApiKey({ byteLength = 32 } = {}) {
  // plaintext returned only once
  const buf = crypto.randomBytes(byteLength);
  // Represent as URL-safe base64
  return buf.toString('base64url');
}

export function hashApiKey(plainApiKey) {
  if (typeof plainApiKey !== 'string' || plainApiKey.trim().length === 0) {
    throw new Error('API key must be a non-empty string.');
  }

  // SHA-256 hash stored permanently
  const normalized = plainApiKey.trim();
  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
}

export function verifyApiKey({ plainApiKey, keyHash }) {
  const computed = hashApiKey(plainApiKey);
  return computed === keyHash;
}
