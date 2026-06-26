import { AppError } from '../utils/AppError.js';

function assertString(value, field, { min = 1, max = 200 } = {}) {
  if (typeof value !== 'string') throw new AppError(`Invalid ${field}`, 400, 'VALIDATION_ERROR');
  const v = value.trim();
  if (v.length < min || v.length > max) throw new AppError(`Invalid ${field}`, 400, 'VALIDATION_ERROR');
  return v;
}

function assertBoolean(value, field) {
  if (typeof value !== 'boolean') throw new AppError(`Invalid ${field}`, 400, 'VALIDATION_ERROR');
  return value;
}

function assertEnum(value, field, allowed, fallback) {
  const normalized = value === undefined || value === null || value === '' ? fallback : String(value).trim();
  if (!allowed.includes(normalized)) throw new AppError(`Invalid ${field}`, 400, 'VALIDATION_ERROR');
  return normalized;
}

function normalizeDomain(domain) {
  if (typeof domain !== 'string') throw new AppError('Invalid domain', 400, 'VALIDATION_ERROR');
  const d = domain.trim().toLowerCase();
  if (!d) throw new AppError('Invalid domain', 400, 'VALIDATION_ERROR');

  // Accept either hostname or full URL.
  try {
    if (d.startsWith('http://') || d.startsWith('https://')) {
      const u = new URL(d);
      return u.host.toLowerCase();
    }
  } catch {
    // ignore and treat as hostname
  }

  return d;
}

export function validateCreateClient(body = {}) {
  const clientName = assertString(body.clientName, 'clientName', { min: 1, max: 120 });
  const clientId = assertString(body.clientId, 'clientId', { min: 2, max: 120 });

  const active = body.active === undefined ? true : assertBoolean(body.active, 'active');
  const environment = assertEnum(body.environment, 'environment', ['prod', 'sandbox'], 'prod');

  const allowedDomains = Array.isArray(body.allowedDomains) ? body.allowedDomains : [];
  const normalizedDomains = allowedDomains.map((d) => {
    const input = typeof d === 'string' ? { domain: d } : d;
    const domain = normalizeDomain(input.domain);
    const allowSubdomains = !!(input.allowSubdomains ?? false);
    const enabled = input.enabled === undefined ? true : !!input.enabled;
    return { domain, allowSubdomains, enabled };
  });

  return { clientName, clientId, active, environment, allowedDomains: normalizedDomains };
}

export function validateUpdateClient(body = {}) {
  const result = {};

  if (body.clientName !== undefined) {
    result.clientName = assertString(body.clientName, 'clientName', { min: 1, max: 120 });
  }

  if (body.notes !== undefined) {
    if (typeof body.notes !== 'string') throw new AppError('Invalid notes', 400, 'VALIDATION_ERROR');
    result.notes = body.notes.trim();
  }

  if (body.active !== undefined) {
    result.active = assertBoolean(body.active, 'active');
  }

  if (body.allowedDomains !== undefined) {
    if (!Array.isArray(body.allowedDomains)) {
      throw new AppError('Invalid allowedDomains', 400, 'VALIDATION_ERROR');
    }

    result.allowedDomains = body.allowedDomains.map((d) => {
      const input = typeof d === 'string' ? { domain: d } : d;
      const domain = normalizeDomain(input.domain);
      const allowSubdomains = !!(input.allowSubdomains ?? false);
      const enabled = input.enabled === undefined ? true : !!input.enabled;
      return { domain, allowSubdomains, enabled };
    });
  }

  if (body.subscriptionStatus !== undefined) {
    if (typeof body.subscriptionStatus !== 'string') throw new AppError('Invalid subscriptionStatus', 400, 'VALIDATION_ERROR');
    result.subscriptionStatus = body.subscriptionStatus.trim();
  }

  return result;
}

export function validateRotateApiKey(body = {}) {
  const environment = body.environment ? String(body.environment).trim() : 'prod';
  if (!['prod', 'sandbox'].includes(environment)) {
    throw new AppError('Invalid environment', 400, 'VALIDATION_ERROR');
  }
  return { environment };
}

export function validateAddDomain(body = {}) {
  const domain = normalizeDomain(body.domain || '');
  if (!domain) throw new AppError('domain is required', 400, 'VALIDATION_ERROR');

  const allowSubdomains = !!(body.allowSubdomains ?? false);
  const enabled = body.enabled === undefined ? true : !!body.enabled;

  return { domain, allowSubdomains, enabled };
}

