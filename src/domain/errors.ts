export class DomainError extends Error {
  constructor(
    readonly status: 400 | 404 | 409,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export class InputValidationError extends DomainError {
  constructor(message: string) {
    super(400, "VALIDATION_ERROR", message);
    this.name = "InputValidationError";
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string) {
    super(404, "NOT_FOUND", message);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(409, "CONFLICT", message);
    this.name = "ConflictError";
  }
}
