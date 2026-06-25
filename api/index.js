import dotenv from 'dotenv';
import { createApp } from '../src/app.js';
import { connectToDatabase, gracefulShutdown } from '../src/config/database.js';
import { validateEnv } from '../src/config/appConfig.js';

dotenv.config();

// Validate env lazily so local/serverless import doesn't crash before env is set.
let env;
let app;
function getEnv() {
  if (!env) env = validateEnv();
  return env;
}

function getApp() {
  if (!app) app = createApp();
  return app;
}


// Vercel compatibility:
// - Vercel may call this file as a serverless function.
// - We export handlers; Express app is mounted in Phase 3.
// - In most setups, api/index.js is used with a serverless adapter.
// Here we export the app handler to keep it framework-compatible.

// In plain Node (local dev), start listening.
// We always export a handler compatible with Vercel.
// For local development, we also start a listener.
let server;

export const handler = async (req, res) => {
  try {
    // Lazy connection for serverless.
    if (!globalThis.__mongoConnectionPromise) {
      globalThis.__mongoConnectionPromise = connectToDatabase();
    }
    await globalThis.__mongoConnectionPromise;
    return getApp()(req, res);
  } catch (error) {
    const statusCode = error?.message?.includes('Missing required environment variables') ? 500 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error instanceof Error ? error.message : 'Serverless invocation failed',
      code: 'FUNCTION_ERROR'
    });
  }
};

export default handler;

if (process.env.VERCEL === undefined) {
  const envNow = getEnv();
  (async () => {
    await connectToDatabase();
    server = getApp().listen(envNow.PORT, () => {
      // eslint-disable-next-line no-console
      console.info(`Server listening on http://localhost:${envNow.PORT}`);
    });
  })().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Failed to start server', err);
    process.exit(1);
  });

  const shutdown = async (reason) => {
    await gracefulShutdown(reason);
    if (server) server.close(() => process.exit(0));
    else process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}


