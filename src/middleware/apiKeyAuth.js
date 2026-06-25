import { AppError } from '../utils/AppError.js';
import { hashApiKey } from '../utils/apiKey.js';
import { Client } from '../models/Client.js';

export function apiKeyAuth({ environment } = {}) {
  return async (req, _res, next) => {
    try {
      const incoming = req.headers?.['x-api-key'];
      if (!incoming || typeof incoming !== 'string') {
        return next(new AppError('Unauthorized', 401, 'MISSING_API_KEY'));
      }

      const keyHash = hashApiKey(incoming);

      const envWanted = environment || undefined;

      const client = await Client.findOne({
        active: true,
        'apiKeys.keyHash': keyHash,
        'apiKeys.status': { $in: ['active'] },
        ...(envWanted ? { 'apiKeys.environment': envWanted } : {})
      }).lean();

      if (!client) return next(new AppError('Unauthorized', 401, 'INVALID_API_KEY'));

      const keyEntry = (client.apiKeys || []).find((k) => k.keyHash === keyHash);
      if (!keyEntry || keyEntry.status !== 'active') {
        return next(new AppError('Unauthorized', 401, 'INVALID_API_KEY_STATUS'));
      }

      req.client = {
        id: client._id.toString(),
        clientName: client.clientName,
        clientId: client.clientId,
        allowedDomains: client.allowedDomains || []
      };

      req.tenantId = client._id;

      return next();
    } catch (err) {
      return next(err);
    }
  };
}

