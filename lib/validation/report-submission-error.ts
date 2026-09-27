import { RepositoryError } from "../repositories/errors.ts";

export const reportSubmissionErrorCode = (error: unknown) => {
  if (!(error instanceof RepositoryError)) return "failed";
  if (error.causeCode === "23505") return "duplicate";
  if (["42501", "FORBIDDEN", "PGRST301"].includes(error.causeCode ?? "")) return "forbidden";
  if (["23503", "23514", "22P02", "22003"].includes(error.causeCode ?? "")) return "invalid";
  return "failed";
};
