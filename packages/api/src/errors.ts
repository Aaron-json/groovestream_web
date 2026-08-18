import type { ApiError } from "./generated/types.gen";

export function isApiError(error: unknown): error is ApiError {
  if (typeof error !== "object" || error === null) return false;

  const candidate = error as Partial<ApiError>;
  return (
    typeof candidate.http_code === "number" &&
    typeof candidate.message === "string" &&
    (candidate.error_code === null ||
      typeof candidate.error_code === "string") &&
    "data" in candidate
  );
}
