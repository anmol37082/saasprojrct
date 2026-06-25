export function createAppLocals(req) {
  const requestId = req?.headers?.['x-request-id'] || undefined;
  return {
    requestId,
    publicView() {
      return requestId ? { requestId } : {};
    }
  };
}

export class ApiResponse {
  static ok({ data, message = 'Success', requestId } = {}) {
    return {
      success: true,
      message,
      requestId,
      data
    };
  }

  static fail({ message = 'Failed', code = 'ERROR', requestId } = {}) {
    return {
      success: false,
      message,
      code,
      requestId
    };
  }
}

