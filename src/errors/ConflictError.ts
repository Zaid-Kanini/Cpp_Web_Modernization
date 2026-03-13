export class ConflictError extends Error {
  public readonly statusCode: number = 409;
  public readonly latestVersion: number;

  constructor(message: string, latestVersion: number) {
    super(message);
    this.name = 'ConflictError';
    this.latestVersion = latestVersion;
    Error.captureStackTrace(this, this.constructor);
  }
}
