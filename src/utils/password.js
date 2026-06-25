import bcrypt from 'bcryptjs';

import { validateEnv } from '../config/appConfig.js';

function getBcryptConfig() {
  // Avoid hard failing at import time if env is not present yet.
  try {
    const env = validateEnv();
    return {
      saltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || env.BCRYPT_SALT_ROUNDS || 12)
    };
  } catch {
    return { saltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 12) };
  }
}

export async function hashPassword(plainPassword) {
  if (typeof plainPassword !== 'string' || plainPassword.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }

  const { saltRounds } = getBcryptConfig();
  return bcrypt.hash(plainPassword, saltRounds);
}

export async function comparePassword(plainPassword, passwordHash) {
  if (typeof plainPassword !== 'string' || !passwordHash) return false;
  return bcrypt.compare(plainPassword, passwordHash);
}

