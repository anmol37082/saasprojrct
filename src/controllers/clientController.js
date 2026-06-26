import { AppError } from '../utils/AppError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as clientService from '../services/clientService.js';

import {
  validateCreateClient,
  validateUpdateClient,
  validateRotateApiKey,
  validateAddDomain
} from '../validators/clientValidator.js';

export async function createClientController(req, res, next) {
  try {
    const body = validateCreateClient(req.body || {});
    const actor = req.auth?.adminId || null;

    const client = await clientService.createClient({ ...body, actor });

    return res
      .status(201)
      .json(ApiResponse.ok({ message: 'Client created', data: client, requestId: req.requestContext?.requestId }));
  } catch (err) {
    return next(err);
  }
}

export async function updateClientController(req, res, next) {
  try {
    const clientDbId = req.params?.clientId;
    if (!clientDbId) throw new AppError('clientId required', 400, 'MISSING_CLIENT_ID');

    const update = validateUpdateClient(req.body || {});
    const actor = req.auth?.adminId || null;

    const client = await clientService.updateClient({ clientDbId, update, actor });

    return res
      .status(200)
      .json(ApiResponse.ok({ message: 'Client updated', data: client, requestId: req.requestContext?.requestId }));
  } catch (err) {
    return next(err);
  }
}

export async function deleteClientController(req, res, next) {
  try {
    const clientDbId = req.params?.clientId;
    if (!clientDbId) throw new AppError('clientId required', 400, 'MISSING_CLIENT_ID');

    const actor = req.auth?.adminId || null;
    await clientService.deleteClient({ clientDbId, actor });

    return res
      .status(200)
      .json(ApiResponse.ok({ message: 'Client deleted', data: { ok: true }, requestId: req.requestContext?.requestId }));
  } catch (err) {
    return next(err);
  }
}

export async function activateClientController(req, res, next) {
  try {
    const clientDbId = req.params?.clientId;
    if (!clientDbId) throw new AppError('clientId required', 400, 'MISSING_CLIENT_ID');

    const actor = req.auth?.adminId || null;
    const client = await clientService.activateClient({ clientDbId, actor });

    return res
      .status(200)
      .json(ApiResponse.ok({ message: 'Client activated', data: client, requestId: req.requestContext?.requestId }));
  } catch (err) {
    return next(err);
  }
}

export async function deactivateClientController(req, res, next) {
  try {
    const clientDbId = req.params?.clientId;
    if (!clientDbId) throw new AppError('clientId required', 400, 'MISSING_CLIENT_ID');

    const actor = req.auth?.adminId || null;
    const client = await clientService.deactivateClient({ clientDbId, actor });

    return res
      .status(200)
      .json(ApiResponse.ok({ message: 'Client deactivated', data: client, requestId: req.requestContext?.requestId }));
  } catch (err) {
    return next(err);
  }
}

export async function rotateApiKeyController(req, res, next) {
  try {
    const clientDbId = req.params?.clientId;
    if (!clientDbId) throw new AppError('clientId required', 400, 'MISSING_CLIENT_ID');

    const { environment } = validateRotateApiKey(req.body || {});
    const actor = req.auth?.adminId || null;

    const result = await clientService.rotateApiKey({ clientDbId, environment, actor });

    return res
      .status(200)
      .json(ApiResponse.ok({ message: 'API key rotated', data: result, requestId: req.requestContext?.requestId }));
  } catch (err) {
    return next(err);
  }
}

export async function addDomainController(req, res, next) {
  try {
    const clientDbId = req.params?.clientId;
    if (!clientDbId) throw new AppError('clientId required', 400, 'MISSING_CLIENT_ID');

    const { domain, allowSubdomains, enabled } = validateAddDomain(req.body || {});
    const actor = req.auth?.adminId || null;

    const client = await clientService.addDomain({
      clientDbId,
      domain,
      allowSubdomains,
      enabled,
      actor
    });

    return res
      .status(200)
      .json(ApiResponse.ok({ message: 'Domain added', data: client, requestId: req.requestContext?.requestId }));
  } catch (err) {
    return next(err);
  }
}

export async function removeDomainController(req, res, next) {
  try {
    const clientDbId = req.params?.clientId;
    if (!clientDbId) throw new AppError('clientId required', 400, 'MISSING_CLIENT_ID');

    const domain = req.body?.domain;
    if (!domain || typeof domain !== 'string') throw new AppError('domain is required', 400, 'VALIDATION_ERROR');

    const actor = req.auth?.adminId || null;
    const client = await clientService.removeDomain({ clientDbId, domain, actor });

    return res
      .status(200)
      .json(ApiResponse.ok({ message: 'Domain removed', data: client, requestId: req.requestContext?.requestId }));
  } catch (err) {
    return next(err);
  }
}

export async function getClientByIdController(req, res, next) {
  try {
    const clientDbId = req.params?.clientId;
    if (!clientDbId) throw new AppError('clientId required', 400, 'MISSING_CLIENT_ID');

    const client = await clientService.getClientById({ clientDbId });

    return res
      .status(200)
      .json(ApiResponse.ok({ message: 'Client retrieved', data: client, requestId: req.requestContext?.requestId }));
  } catch (err) {
    return next(err);
  }
}

export async function getAllClientsController(req, res, next) {
  try {
    const page = req.query?.page;
    const limit = req.query?.limit;
    const search = req.query?.search;
    const active = req.query?.active;
    const status = req.query?.status;

    let activeBool;
    if (typeof status === 'string' && status.trim().length > 0 && status !== 'all') {
      activeBool = status === 'active';
    } else if (active !== undefined && active !== '' && active !== 'all') {
      activeBool = active === 'true' || active === true;
    }

    const result = await clientService.listClients({ page, limit, search, active: activeBool });

    return res
      .status(200)
      .json(ApiResponse.ok({ message: 'Clients list retrieved', data: result, requestId: req.requestContext?.requestId }));
  } catch (err) {
    return next(err);
  }
}

