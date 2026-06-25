import jwt from 'jsonwebtoken';

import { validateEnv } from '../config/appConfig.js';

function envOrDefaults() {
  try {
    return validateEnv();
  } catch {
    return {
      JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
      JWT_ACCESS_TTL_SECONDS: Number(process.env.JWT_ACCESS_TTL_SECONDS || 900),
      JWT_REFRESH_TTL_SECONDS: Number(process.env.JWT_REFRESH_TTL_SECONDS || 60 * 60 * 24 * 30)
    };
  }
}

function getSecrets() {
  const env = envOrDefaults();

  const accessSecret = process.env.JWT_ACCESS_SECRET || env.JWT_ACCESS_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET || env.JWT_REFRESH_SECRET;

  if (!accessSecret || !refreshSecret) {
    // Throwing is fine: token ops happen only when env is configured.
    throw new Error('Missing JWT secrets (JWT_ACCESS_SECRET and JWT_REFRESH_SECRET).');
  }

  return {
    accessSecret,
    refreshSecret,
    accessTtlSeconds: Number(process.env.JWT_ACCESS_TTL_SECONDS || env.JWT_ACCESS_TTL_SECONDS || 900),
    refreshTtlSeconds: Number(process.env.JWT_REFRESH_TTL_SECONDS || env.JWT_REFRESH_TTL_SECONDS || 60 * 60 * 24 * 30)
  };
}

export function signAccessToken({ adminId, tenantId, role, scopes }) {
  const { accessSecret, accessTtlSeconds } = getSecrets();

  return jwt.sign(
    {
      typ: 'access',
      adminId,
      tenantId,
      role: role || 'admin',
      scopes: scopes || []
    },
    accessSecret,
    { expiresIn: accessTtlSeconds }
  );
}

export function signRefreshToken({ adminId, tenantId, role }) {
  const { refreshSecret, refreshTtlSeconds } = getSecrets();

  return jwt.sign(
    {
      typ: 'refresh',
      adminId,
      tenantId,
      role: role || 'admin'
    },
    refreshSecret,
    { expiresIn: refreshTtlSeconds }
  );
}

export function verifyAccessToken(token) {
  const { accessSecret } = getSecrets();
  return jwt.verify(token, accessSecret);
}

export function verifyRefreshToken(token) {
  const { refreshSecret } = getSecrets();
  return jwt.verify(token, refreshSecret);
}

