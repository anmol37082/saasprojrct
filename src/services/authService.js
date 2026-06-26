import crypto from 'node:crypto';

import { Admin } from '../models/Admin.js';
import { AdminSession } from '../models/AdminSession.js';
import { comparePassword } from '../utils/password.js';
import { signAccessToken, signRefreshToken } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';
import { hashPassword } from '../utils/password.js';
import { Notification } from '../models/Notification.js';

// AuthService responsibilities:
// - verify credentials
// - issue tokens
// - do not expose DB details to controllers

function normalizeText(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

async function createSession({ admin, req }) {
  const sessionId = crypto.randomUUID();
  const tenantId = admin.tenantId ? admin.tenantId.toString() : null;
  await AdminSession.create({
    adminId: admin._id,
    tenantId: admin.tenantId ?? null,
    sessionId,
    userAgent: req?.headers?.['user-agent'] || '',
    ipAddress: req?.ip || '',
    lastSeenAt: new Date()
  });

  return {
    sessionId,
    sessionVersion: Number(admin.sessionVersion ?? 0),
    tenantId
  };
}

export async function login({ email, password, req }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail || !password) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  // Admin collection holds passwordHash but it's select:false by default.
  const admin = await Admin.findOne({ email: normalizedEmail, active: true }).select('+passwordHash sessionVersion displayName avatarUrl timezone language');

  if (!admin) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const ok = await comparePassword(password, admin.passwordHash);
  if (!ok) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const { sessionId, sessionVersion, tenantId } = await createSession({ admin, req });

  const accessToken = signAccessToken({
    adminId: admin._id.toString(),
    tenantId,
    role: admin.role,
    sessionId,
    sessionVersion
  });

  const refreshToken = signRefreshToken({
    adminId: admin._id.toString(),
    tenantId,
    role: admin.role,
    sessionId,
    sessionVersion
  });

  return {
    accessToken,
    refreshToken,
    admin: {
      id: admin._id.toString(),
      email: admin.email,
      role: admin.role,
      tenantId,
      displayName: admin.displayName || '',
      avatarUrl: admin.avatarUrl || '',
      timezone: admin.timezone || 'Asia/Calcutta',
      language: admin.language || 'en'
    }
  };
}

export async function logout({ refreshToken }) {
  if (!refreshToken) {
    return { ok: true };
  }

  try {
    const { verifyRefreshToken } = await import('../utils/jwt.js');
    const payload = verifyRefreshToken(refreshToken);
    if (payload?.sessionId) {
      await AdminSession.updateOne(
        { sessionId: payload.sessionId },
        {
          $set: {
            revokedAt: new Date()
          }
        }
      );
    }
  } catch {
    // best-effort logout
  }

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

  const admin = await Admin.findById(payload.adminId).select('email role active tenantId sessionVersion displayName avatarUrl timezone language');
  if (!admin || !admin.active) {
    throw new AppError('Unauthorized', 401, 'ADMIN_NOT_ACTIVE');
  }

  if (Number(admin.sessionVersion ?? 0) !== Number(payload.sessionVersion ?? 0)) {
    throw new AppError('Unauthorized', 401, 'SESSION_REVOKED');
  }

  const tenantId = admin.tenantId ? admin.tenantId.toString() : null;

  const access = signAccessToken({
    adminId: admin._id.toString(),
    tenantId,
    role: admin.role,
    sessionId: payload.sessionId,
    sessionVersion: admin.sessionVersion
  });

  const refresh = signRefreshToken({
    adminId: admin._id.toString(),
    tenantId,
    role: admin.role,
    sessionId: payload.sessionId,
    sessionVersion: admin.sessionVersion
  });

  return {
    accessToken: access,
    refreshToken: refresh,
    admin: {
      id: admin._id.toString(),
      email: admin.email,
      role: admin.role,
      tenantId,
      displayName: admin.displayName || '',
      avatarUrl: admin.avatarUrl || '',
      timezone: admin.timezone || 'Asia/Calcutta',
      language: admin.language || 'en'
    }
  };
}

export async function me({ adminId }) {
  const admin = await Admin.findById(adminId).select('email role active tenantId displayName avatarUrl timezone language sessionVersion createdAt lastLogin notificationPreferences emailPreferences pushPreferences');
  if (!admin) throw new AppError('Unauthorized', 401, 'ADMIN_NOT_FOUND');

  return {
    id: admin._id.toString(),
    email: admin.email,
    role: admin.role,
    tenantId: admin.tenantId ? admin.tenantId.toString() : null,
    displayName: admin.displayName || '',
    avatarUrl: admin.avatarUrl || '',
    timezone: admin.timezone || 'Asia/Calcutta',
    language: admin.language || 'en',
    sessionVersion: Number(admin.sessionVersion ?? 0),
    createdAt: admin.createdAt,
    lastLogin: admin.lastLogin,
    notificationPreferences: admin.notificationPreferences || {},
    emailPreferences: admin.emailPreferences || {},
    pushPreferences: admin.pushPreferences || {}
  };
}

export async function updateProfile({ adminId, payload = {} }) {
  const admin = await Admin.findById(adminId).select('email role active tenantId displayName avatarUrl timezone language lastLogin');
  if (!admin) throw new AppError('Unauthorized', 401, 'ADMIN_NOT_FOUND');

  admin.displayName = normalizeText(payload.displayName, admin.displayName);
  admin.avatarUrl = normalizeText(payload.avatarUrl, admin.avatarUrl);
  admin.timezone = normalizeText(payload.timezone, admin.timezone);
  admin.language = normalizeText(payload.language, admin.language);
  await admin.save();

  return me({ adminId });
}

export async function changePassword({ adminId, currentPassword, newPassword }) {
  const admin = await Admin.findById(adminId).select('+passwordHash sessionVersion');
  if (!admin) throw new AppError('Unauthorized', 401, 'ADMIN_NOT_FOUND');

  const ok = await comparePassword(currentPassword, admin.passwordHash);
  if (!ok) throw new AppError('Invalid current password', 400, 'INVALID_CURRENT_PASSWORD');

  admin.passwordHash = await hashPassword(newPassword);
  admin.sessionVersion = Number(admin.sessionVersion ?? 0) + 1;
  await admin.save();

  return { ok: true };
}

export async function listSessions({ adminId }) {
  const sessions = await AdminSession.find({ adminId }).sort({ createdAt: -1 }).lean();
  return sessions.map((session) => ({
    id: session.sessionId,
    sessionId: session.sessionId,
    userAgent: session.userAgent || '',
    ipAddress: session.ipAddress || '',
    lastSeenAt: session.lastSeenAt || session.updatedAt || session.createdAt || null,
    revokedAt: session.revokedAt || null,
    createdAt: session.createdAt
  }));
}

export async function logoutAllDevices({ adminId }) {
  const admin = await Admin.findById(adminId).select('sessionVersion');
  if (!admin) throw new AppError('Unauthorized', 401, 'ADMIN_NOT_FOUND');

  admin.sessionVersion = Number(admin.sessionVersion ?? 0) + 1;
  await admin.save();
  await AdminSession.updateMany({ adminId }, { $set: { revokedAt: new Date() } });

  return { ok: true };
}

export async function listNotifications({ adminId }) {
  const [items, unreadCount] = await Promise.all([
    Notification.find({ adminId }).sort({ createdAt: -1 }).limit(50).lean(),
    Notification.countDocuments({ adminId, readAt: null })
  ]);

  return {
    items: items.map((item) => ({
      id: item._id.toString(),
      title: item.title,
      body: item.body || '',
      category: item.category || 'system',
      severity: item.severity || 'info',
      readAt: item.readAt || null,
      createdAt: item.createdAt
    })),
    unreadCount
  };
}

