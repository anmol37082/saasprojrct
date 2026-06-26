import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { createRequire } from 'module';
import { validateEnv } from './config/appConfig.js';

import { notFoundHandler } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

import { createAppLocals } from './utils/ApiResponse.js';

import { buildAuthRouter } from './routes/authRoutes.js';
import { buildClientRouter } from './routes/clientRoutes.js';
import { buildLeadRouter } from './routes/leadRoutes.js';
import { buildLeadManagementRouter } from './routes/leadManagementRoutes.js';
import { buildExportRouter } from './routes/exportRoutes.js';
import { buildAuditLogRouter } from './routes/auditLogRoutes.js';
import { buildDashboardRouter } from './routes/dashboardRoutes.js';
import { buildNotificationRouter } from './routes/notificationRoutes.js';
import { buildSettingsRouter } from './routes/settingsRoutes.js';

import { buildSwaggerSpec } from './config/swagger.js';

const require = createRequire(import.meta.url);

function loadSwaggerUi() {
  try {
    return require('swagger-ui-express');
  } catch {
    return null;
  }
}

export function createApp() {
  const env = validateEnv();

  const app = express();

  // Trust proxy if behind Vercel / reverse proxy
  app.set('trust proxy', 1);

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: false
    })
  );

  // CORS (tight by default)
  const corsOptions = {
    origin: true,
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Domain', 'X-Request-Id', 'Idempotency-Key', 'Accept']
  };
  app.use(cors(corsOptions));
  app.options(/.*/, cors(corsOptions));

  // Request parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));

  // Logging
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // Rate limiting (foundation only)
  app.use(
      rateLimit({
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        limit: env.RATE_LIMIT_MAX,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        message: { message: 'Too many requests. Try again later.' },
      keyGenerator: (req) => {
        // Placeholder: in Phase 3, use API key / tenantId when available
        return req.ip || 'unknown';
      }
    })
  );

  // Healthcheck (no business logic)
  app.get('/health', (req, res) => {
    const locals = createAppLocals(req);
    return res.status(200).json({ ok: true, ...locals.publicView() });
  });

  // Swagger UI
  const swaggerSpec = buildSwaggerSpec({ basePath: '/api' });
  const swaggerUi = loadSwaggerUi();
  if (swaggerUi) {
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  }


  // Routes mounting (API)
  app.use('/api/auth', buildAuthRouter());

  app.use('/api/clients', buildClientRouter());
  app.use('/api/leads', buildLeadRouter());
  app.use('/api/leads-management', buildLeadManagementRouter());
  app.use('/api/exports', buildExportRouter());
  app.use('/api/audit-logs', buildAuditLogRouter());
  app.use('/api/dashboard', buildDashboardRouter());
  app.use('/api/notifications', buildNotificationRouter());
  app.use('/api/settings', buildSettingsRouter());


  // Attach request correlation context (requestId/ip/userAgent)

  // Done at app-level so it applies to all auth and future APIs.
  // NOTE: in Phase 3/4 routing builders this may also be used; this is additive.
  // eslint-disable-next-line no-unused-vars


  // Middleware placeholders for Phase 3 (routes will be attached later)

  // 404
  app.use(notFoundHandler);

  // Error handler
  app.use(errorHandler);

  return app;
}

let cachedApp;

function getCachedApp() {
  if (!cachedApp) cachedApp = createApp();
  return cachedApp;
}

export default async function handler(req, res) {
  try {
    if (!globalThis.__mongoConnectionPromise) {
      const { connectToDatabase } = await import('./config/database.js');
      globalThis.__mongoConnectionPromise = connectToDatabase();
    }
    await globalThis.__mongoConnectionPromise;
    return getCachedApp()(req, res);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Serverless invocation failed',
      code: 'FUNCTION_ERROR'
    });
  }
}

