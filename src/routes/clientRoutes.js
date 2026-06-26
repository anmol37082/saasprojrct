import express from 'express';

import { authMiddleware } from '../middleware/authMiddleware.js';
import { rbacMiddleware } from '../middleware/rbacMiddleware.js';
import { requestContextMiddleware } from '../middleware/requestContext.js';
import { asyncHandler } from '../utils/asyncHandler.js';

import {
  createClientController,
  updateClientController,
  deleteClientController,
  activateClientController,
  deactivateClientController,
  rotateApiKeyController,
  addDomainController,
  removeDomainController,
  getClientByIdController,
  getAllClientsController
} from '../controllers/clientController.js';

export function buildClientRouter() {
  const router = express.Router();

  router.use(requestContextMiddleware);

  // Requires admin JWT.
  router.post(
    '/',
    authMiddleware({ required: true }),
    rbacMiddleware({ permissions: ['clients:write'] }),
    asyncHandler(createClientController)
  );

  router.patch(
    '/:clientId',
    authMiddleware({ required: true }),
    rbacMiddleware({ permissions: ['clients:write'] }),
    asyncHandler(updateClientController)
  );

  router.delete(
    '/:clientId',
    authMiddleware({ required: true }),
    rbacMiddleware({ permissions: ['clients:delete'] }),
    asyncHandler(deleteClientController)
  );

  router.post(
    '/:clientId/activate',
    authMiddleware({ required: true }),
    rbacMiddleware({ permissions: ['clients:write'] }),
    asyncHandler(activateClientController)
  );

  router.post(
    '/:clientId/deactivate',
    authMiddleware({ required: true }),
    rbacMiddleware({ permissions: ['clients:write'] }),
    asyncHandler(deactivateClientController)
  );

  router.post(
    '/:clientId/rotate-api-key',
    authMiddleware({ required: true }),
    rbacMiddleware({ permissions: ['clients:write'] }),
    asyncHandler(rotateApiKeyController)
  );

  router.post(
    '/:clientId/domains',
    authMiddleware({ required: true }),
    rbacMiddleware({ permissions: ['clients:write'] }),
    asyncHandler(addDomainController)
  );

  router.delete(
    '/:clientId/domains',
    authMiddleware({ required: true }),
    rbacMiddleware({ permissions: ['clients:write'] }),
    asyncHandler(removeDomainController)
  );

  router.get(
    '/:clientId',
    authMiddleware({ required: true }),
    rbacMiddleware({ permissions: ['clients:read'] }),
    asyncHandler(getClientByIdController)
  );

  router.get(
    '/',
    authMiddleware({ required: true }),
    rbacMiddleware({ permissions: ['clients:read'] }),
    asyncHandler(getAllClientsController)
  );

  return router;
}

