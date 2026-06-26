import { AppError } from '../utils/AppError.js';

const RESERVED_TOP_LEVEL_KEYS = new Set([
  'tenantId',
  'clientId',
  'promotedFields',
  'schemaVersion',
  'metadata',
  'attribution',
  'createdAt',
  'updatedAt'
]);

function isPlainObject(value) {
  if (value === null || typeof value !== 'object') return false;
  if (Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function getNestingDepth(obj) {
  const seen = new Set();

  function walk(value, depth) {
    if (depth > 0) {
      if (seen.has(value)) return depth;
      seen.add(value);
    }
    if (value === null) return depth;
    if (Array.isArray(value)) {
      let max = depth;
      for (const item of value) max = Math.max(max, walk(item, depth + 1));
      return max;
    }
    if (typeof value === 'object') {
      let max = depth;
      for (const v of Object.values(value)) {
        max = Math.max(max, walk(v, depth + 1));
      }
      return max;
    }
    return depth;
  }

  return walk(obj, 0);
}

function countKeys(obj) {
  let count = 0;
  const stack = [obj];
  while (stack.length) {
    const cur = stack.pop();
    if (cur && typeof cur === 'object') {
      if (Array.isArray(cur)) {
        for (const item of cur) stack.push(item);
      } else {
        count += Object.keys(cur).length;
        for (const v of Object.values(cur)) stack.push(v);
      }
    }
  }
  return count;
}

function maxArrayLength(value, currentMax = 0) {
  let maxLen = currentMax;
  const stack = [value];

  while (stack.length) {
    const cur = stack.pop();
    if (Array.isArray(cur)) {
      maxLen = Math.max(maxLen, cur.length);
      for (const item of cur) stack.push(item);
    } else if (cur && typeof cur === 'object') {
      for (const v of Object.values(cur)) stack.push(v);
    }
  }

  return maxLen;
}

function maxStringLength(value, currentMax = 0) {
  let maxLen = currentMax;
  const stack = [value];

  while (stack.length) {
    const cur = stack.pop();
    if (typeof cur === 'string') {
      maxLen = Math.max(maxLen, cur.length);
      continue;
    }
    if (Array.isArray(cur)) {
      for (const item of cur) stack.push(item);
      continue;
    }
    if (cur && typeof cur === 'object') {
      for (const v of Object.values(cur)) stack.push(v);
    }
  }

  return maxLen;
}

function rejectReservedKeys(obj) {
  // Reject reserved keys at any depth to prevent mass-assignment.
  // This is intentionally strict.
  const stack = [obj];
  while (stack.length) {
    const cur = stack.pop();
    if (Array.isArray(cur)) {
      for (const item of cur) stack.push(item);
      continue;
    }
    if (cur && typeof cur === 'object') {
      for (const [k, v] of Object.entries(cur)) {
        if (RESERVED_TOP_LEVEL_KEYS.has(k)) {
          throw new AppError('Reserved key in payload', 400, 'RESERVED_KEY');
        }
        stack.push(v);
      }
    }
  }
}

export function leadValidator(options = {}) {
  const {
    maxPayloadBytes = 1024 * 1000, // 1MB
    maxNestingDepth = 20,
    maxKeyCount = 200,
    maxArrayLength = 50,
    maxStringLength = 1000
  } = options;

  return (req, _res, next) => {
    try {
      // Express.json already enforces a limit, but we validate based on actual size too.
      const raw = req.rawBody || undefined;
      // If rawBody isn't available, we rely on JSON parsing + size limits in Phase 3.
      if (raw && raw.length > maxPayloadBytes) {
        throw new AppError('Payload too large', 413, 'PAYLOAD_TOO_LARGE');
      }

      const body = req.body;
      if (!isPlainObject(body)) {
        throw new AppError('Payload must be a JSON object', 400, 'INVALID_PAYLOAD');
      }

      // Key count
      const keyCount = countKeys(body);
      if (keyCount > maxKeyCount) {
        throw new AppError('Too many keys in payload', 400, 'TOO_MANY_KEYS');
      }

      // Nesting depth
      const depth = getNestingDepth(body);
      if (depth > maxNestingDepth) {
        throw new AppError('Payload nesting too deep', 400, 'NESTING_TOO_DEEP');
      }

      // Arrays
      const arrMaxLen = maxArrayLength(body);
      if (arrMaxLen > maxArrayLength) {
        throw new AppError('Array length too large', 400, 'ARRAY_TOO_LARGE');
      }

      // Strings
      const strMax = maxStringLength(body);
      if (strMax > maxStringLength) {
        throw new AppError('String value too large', 400, 'STRING_TOO_LARGE');
      }

      // Reserved keys protection
      rejectReservedKeys(body);

      req.leadPayload = body;
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

export function validateUpdateLead(body = {}) {
  const result = {};

  if (body.status !== undefined) {
    if (typeof body.status !== 'string') throw new AppError('Invalid status', 400, 'VALIDATION_ERROR');
    const status = body.status.trim();
    if (!status || status.length > 50) throw new AppError('Invalid status', 400, 'VALIDATION_ERROR');
    result.status = status;
  }

  return result;
}

