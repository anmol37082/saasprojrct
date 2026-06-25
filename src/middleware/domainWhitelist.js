import { AppError } from '../utils/AppError.js';

function normalizeDomainHost(host) {
  if (!host) return '';
  return String(host).trim().toLowerCase();
}

function parseOrigin(req) {
  const origin = req.headers?.origin;
  if (origin && typeof origin === 'string') return origin.trim();
  return '';
}

function parseReferer(req) {
  const referer = req.headers?.referer;
  if (!referer || typeof referer !== 'string') return '';
  return referer.trim();
}

function originHostFromUrl(url) {
  if (!url) return '';
  try {
    return new URL(url).host;
  } catch {
    // fallback: if referer/origin is just host
    return url.split('/')[0];
  }
}

function domainMatch({ allowedDomain, incomingHost }) {
  const allowed = normalizeDomainHost(allowedDomain.domain);
  const incoming = normalizeDomainHost(incomingHost);

  if (!allowed || !incoming) return false;
  if (incoming === allowed) return true;

  if (allowedDomain.allowSubdomains) {
    return incoming.endsWith(`.${allowed}`);
  }

  return false;
}

export function domainWhitelist() {
  return (req, _res, next) => {
    const reqClient = req.client;
    if (!reqClient) return next(new AppError('Unauthorized', 401, 'MISSING_CLIENT_CONTEXT'));

    const allowedDomains = Array.isArray(reqClient.allowedDomains) ? reqClient.allowedDomains : [];
    if (!allowedDomains.length) return next(new AppError('Forbidden', 403, 'DOMAIN_NOT_ALLOWED'));

    const origin = parseOrigin(req);
    const referer = parseReferer(req);

    const originHost = origin ? originHostFromUrl(origin) : '';
    const refererHost = referer ? originHostFromUrl(referer) : '';

    const candidates = [originHost, refererHost].filter(Boolean);

    if (!candidates.length) return next(new AppError('Forbidden', 403, 'DOMAIN_NOT_ALLOWED'));

    // Normalized sourceDomain for downstream usage
    // Prefer Origin host when present; otherwise use Referer host.
    req.sourceDomain = (originHost || refererHost || '').toLowerCase();
    // Also expose on req.client if downstream code expects it there.
    if (req.client && typeof req.client === 'object') {
      req.client.sourceDomain = req.sourceDomain;
    }


    const matched = candidates.some((incomingHost) =>
      allowedDomains.some((ad) => ad.enabled !== false && domainMatch({ allowedDomain: ad, incomingHost }))
    );

    if (!matched) return next(new AppError('Forbidden', 403, 'DOMAIN_NOT_ALLOWED'));

    return next();

  };
}

