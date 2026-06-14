export class SatoshiBaseError extends Error {
  constructor(message, { statusCode = 500, cause = null, context = {} } = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.cause = cause;
    this.context = context;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class ExternalApiError extends SatoshiBaseError {
  constructor(message, { provider = null, upstreamStatus = null, ...rest } = {}) {
    super(message, { statusCode: 502, ...rest });
    this.provider = provider;
    this.upstreamStatus = upstreamStatus;
  }
}

export class PublicFeedError extends SatoshiBaseError {
  constructor(message, { statusCode = 502, ...rest } = {}) {
    super(message, { statusCode, ...rest });
    this.name = 'PublicFeedError';
  }
}
