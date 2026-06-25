import express from 'express';

import { apiKeyAuth } from '../middleware/apiKeyAuth.js';
import { domainWhitelist } from '../middleware/domainWhitelist.js';
import { requestContextMiddleware } from '../middleware/requestContext.js';

import { leadValidator } from '../validators/leadValidator.js';
import { createLeadController } from '../controllers/leadController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export function buildLeadRouter() {
  const router = express.Router();

  router.use(requestContextMiddleware);

  // Public lead ingestion
  router.post(
    '/',
    apiKeyAuth(),
    domainWhitelist(),
    leadValidator(),
    asyncHandler(createLeadController)
  );

  return router;
}

