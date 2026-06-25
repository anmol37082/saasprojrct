// Kept for backward compatibility with any future middleware that might rely on this utility.
export function getRequestId(req) {
  return (req?.headers?.['x-request-id'] || '').toString();
}

