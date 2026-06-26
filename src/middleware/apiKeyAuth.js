import { AppError } from '../utils/AppError.js';
import { hashApiKey } from '../utils/apiKey.js';
import { Client } from '../models/Client.js';

function readIncomingApiKey(req) {
  const headers = req.headers ?? {};

  const headerKey = headers['x-api-key'];
  if (typeof headerKey === 'string' && headerKey.trim()) return headerKey.trim();

  const authorization = headers.authorization;
  if (typeof authorization === 'string' && authorization.trim()) {
    const value = authorization.trim();
    const bearerMatch = value.match(/^Bearer\s+(.+)$/i);
    if (bearerMatch?.[1]) return bearerMatch[1].trim();

    const apiKeyMatch = value.match(/^ApiKey\s+(.+)$/i);
    if (apiKeyMatch?.[1]) return apiKeyMatch[1].trim();

    return value;
  }

  return '';
}

export function apiKeyAuth({ environment } = {}) {
  return async (req, _res, next) => {
    try {
      const incoming = readIncomingApiKey(req);
      if (!incoming) {
        return next(new AppError('Unauthorized', 401, 'MISSING_API_KEY'));
      }

      const keyHash = hashApiKey(incoming);

      const envWanted = environment || undefined;

      const client = await Client.findOne({
        active: true,
        'apiKeys.keyHash': keyHash,
        'apiKeys.status': { $in: ['active'] },
        ...(envWanted ? { 'apiKeys.environment': envWanted } : {})
      });

      if (!client) return next(new AppError('Unauthorized', 401, 'INVALID_API_KEY'));

      const keyEntry = (client.apiKeys || []).find((k) => k.keyHash === keyHash);
      if (!keyEntry || keyEntry.status !== 'active') {
        return next(new AppError('Unauthorized', 401, 'INVALID_API_KEY_STATUS'));
      }

      keyEntry.lastUsedAt = new Date();
      await client.save();

      req.client = {
        id: client._id.toString(),
        clientName: client.clientName,
        clientId: client.clientId,
        allowedDomains: client.allowedDomains || [],
        apiKey: {
          label: keyEntry.label || '',
          environment: keyEntry.environment || 'prod',
          status: keyEntry.status || 'active',
          createdAt: keyEntry.createdAt || null,
          rotatedAt: keyEntry.rotatedAt || null,
          lastUsedAt: keyEntry.lastUsedAt || null
        }
      };

      req.tenantId = client._id;

      return next();
    } catch (err) {
      return next(err);
    }
  };
}

