import mongoose from 'mongoose';

import { validateEnv } from './appConfig.js';

let isConnected = false;

export async function connectToDatabase() {
  const env = validateEnv();

  if (isConnected) return mongoose.connection;

  const mongoOptions = {
    dbName: env.MONGODB_DB_NAME,
    autoIndex: env.NODE_ENV !== 'production',
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    heartbeatFrequencyMS: 10000,

    // Mongoose 8 defaults are generally good; keep explicit options minimal.
  };

  // Connection retry strategy
  const maxRetries = 5;
  const baseDelayMs = 500; // exponential backoff: baseDelay * 2^attempt

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await mongoose.connect(env.MONGODB_URI, mongoOptions);
      isConnected = true;
      return mongoose.connection;
    } catch (err) {
      const delay = Math.min(5000, baseDelayMs * 2 ** (attempt - 1));
      if (attempt === maxRetries) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

export async function gracefulShutdown(signalOrReason = 'shutdown') {
  try {
    if (mongoose.connection.readyState === 0) return;
    await mongoose.connection.close(false);
  } catch {
    // ignore
  } finally {
    // In serverless, avoid hard exits; still safe to allow process to end.
    // eslint-disable-next-line no-console
    console.info(`Database closed (${signalOrReason}).`);
  }
}

