export function validateEnv() {
  const required = ['MONGODB_URI', 'MONGODB_DB_NAME'];

  const missing = required.filter((k) => !process.env[k] || process.env[k].trim().length === 0);
  if (missing.length) {
    const msg = `Missing required environment variables: ${missing.join(', ')}`;
    throw new Error(msg);
  }

  const env = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: Number(process.env.PORT || 3000),

    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,

    RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX || 300),

    CORS_ORIGINS: (process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean),
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',

    BCRYPT_SALT_ROUNDS: Number(process.env.BCRYPT_SALT_ROUNDS || 12),

    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    JWT_ACCESS_TTL_SECONDS: Number(process.env.JWT_ACCESS_TTL_SECONDS || 900),
    JWT_REFRESH_TTL_SECONDS: Number(process.env.JWT_REFRESH_TTL_SECONDS || 60 * 60 * 24 * 30)
  };

  if (!Number.isFinite(env.PORT) || env.PORT <= 0) {
    throw new Error('Invalid PORT. Must be a positive number.');
  }

  if (!Number.isFinite(env.RATE_LIMIT_WINDOW_MS) || env.RATE_LIMIT_WINDOW_MS <= 0) {
    throw new Error('Invalid RATE_LIMIT_WINDOW_MS. Must be a positive number.');
  }

  if (!Number.isFinite(env.RATE_LIMIT_MAX) || env.RATE_LIMIT_MAX <= 0) {
    throw new Error('Invalid RATE_LIMIT_MAX. Must be a positive number.');
  }

  return env;
}

