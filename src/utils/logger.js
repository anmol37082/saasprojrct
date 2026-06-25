import { validateEnv } from '../config/appConfig.js';

const env = (() => {
  try {
    return validateEnv();
  } catch {
    return { LOG_LEVEL: 'info', NODE_ENV: 'development' };
  }
})();

function levelWeight(level) {
  switch (level) {
    case 'error':
      return 0;
    case 'warn':
      return 1;
    case 'info':
      return 2;
    case 'debug':
      return 3;
    default:
      return 2;
  }
}

const current = levelWeight(env.LOG_LEVEL);

function shouldLog(level) {
  return levelWeight(level) <= current;
}

export const logger = {
  info: (obj) => {
    if (!shouldLog('info')) return;
    // eslint-disable-next-line no-console
    console.info(JSON.stringify(obj));
  },
  warn: (obj) => {
    if (!shouldLog('warn')) return;
    // eslint-disable-next-line no-console
    console.warn(JSON.stringify(obj));
  },
  error: (obj) => {
    if (!shouldLog('error')) return;
    // eslint-disable-next-line no-console
    console.error(JSON.stringify(obj));
  },
  debug: (obj) => {
    if (!shouldLog('debug')) return;
    // eslint-disable-next-line no-console
    console.debug(JSON.stringify(obj));
  }
};

