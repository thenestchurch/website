export class RepositoryError extends Error {
  readonly causeCode: string | null;

  constructor(message: string, causeCode: string | null = null) {
    super(message);
    this.causeCode = causeCode;
    this.name = "RepositoryError";
  }
}
