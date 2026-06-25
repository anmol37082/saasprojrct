export class AppError extends Error {
  /**
   * @param {string} publicMessage
   * @param {number} statusCode
   * @param {string} code
   * @param {string} [detail]
   */
  constructor(publicMessage, statusCode = 500, code = 'INTERNAL_ERROR', detail) {
    super(publicMessage);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.publicMessage = publicMessage;
    this.detail = detail;

    // Maintains proper stack trace (only in V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

