import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import { validateEnv } from '../config/appConfig.js';

// NOTE: This file exists for Phase 4 documentation consistency.
// The actual middleware is wired in src/app.js.
// In Phase 5 we can refactor into per-router/app security modules.

export function applyBasicSecurity(app) {
  const env = validateEnv();

  app.use(
    helmet({
      contentSecurityPolicy: false
    })
  );

  const allowedOrigins = env.CORS_ORIGINS.length ? env.CORS_ORIGINS : undefined;
  app.use(
    cors({
      origin: allowedOrigins || true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Domain', 'X-Request-Id', 'Idempotency-Key', 'Accept']
    })
  );

  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      limit: env.RATE_LIMIT_MAX,
      standardHeaders: 'draft--7',
      legacyHeaders: false,
      message: { message: 'Too many requests. Try again later.' },
      keyGenerator: (req) => req.ip || 'unknown'
    })
  );
}

