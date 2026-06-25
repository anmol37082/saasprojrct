import { Client } from '../models/Client.js';
import { Admin } from '../models/Admin.js';
import { comparePassword } from '../utils/password.js';
import { signAccessToken, signRefreshToken } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';

// AuthService responsibilities:
// - verify credentials
// - issue tokens
// - do not expose DB details to controllers

export async function login({ email, password }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail || !password) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  // Admin collection holds passwordHash but it's select:false by default.
  const admin = await Admin.findOne({ email: normalizedEmail, active: true }).select('+passwordHash');

  if (!admin) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const ok = await comparePassword(password, admin.passwordHash);
  if (!ok) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const tenantId = admin.tenantId ? admin.tenantId.toString() : null;

  const accessToken = signAccessToken({
    adminId: admin._id.toString(),
    tenantId,
    role: admin.role
  });

  const refreshToken = signRefreshToken({
    adminId: admin._id.toString(),
    tenantId,
    role: admin.role
  });

  return {
    accessToken,
    refreshToken,
    admin: {
      id: admin._id.toString(),
      email: admin.email,
      role: admin.role,
      tenantId
    }
  };
}

export async function logout({ _refreshToken }) {
  // Stateless refresh tokens: without token revocation storage, logout is best-effort.
  // For production revocation, Phase 5 can add refresh token jti + blacklist collection.
  return { ok: true };
}

export async function refreshToken({ refreshToken }) {
  // Implementation uses JWT verification in jwt.js via controllers/middleware in Phase 4.
  // We keep this method thin; Phase 4 controllers will call verifyRefreshToken.
  const { verifyRefreshToken } = await import('../utils/jwt.js');
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError('Unauthorized', 401, 'INVALID_REFRESH_TOKEN');
  }

  if (!payload || payload.typ !== 'refresh') {
    throw new AppError('Unauthorized', 401, 'INVALID_REFRESH_TOKEN_TYPE');
  }

  const admin = await Admin.findById(payload.adminId).select('email role active tenantId');
  if (!admin || !admin.active) {
    throw new AppError('Unauthorized', 401, 'ADMIN_NOT_ACTIVE');
  }

  const tenantId = admin.tenantId ? admin.tenantId.toString() : null;

  const access = signAccessToken({
    adminId: admin._id.toString(),
    tenantId,
    role: admin.role
  });

  const refresh = signRefreshToken({
    adminId: admin._id.toString(),
    tenantId,
    role: admin.role
  });

  return {
    accessToken: access,
    refreshToken: refresh,
    admin: {
      id: admin._id.toString(),
      email: admin.email,
      role: admin.role,
      tenantId
    }
  };
}

export async function me({ adminId }) {
  const admin = await Admin.findById(adminId).select('email role active tenantId');
  if (!admin) throw new AppError('Unauthorized', 401, 'ADMIN_NOT_FOUND');

  return {
    id: admin._id.toString(),
    email: admin.email,
    role: admin.role,
    tenantId: admin.tenantId ? admin.tenantId.toString() : null
  };
}

