// Every fault of the API reaches the app as one kind of error, with a message for the user.
import type { ErrorDetail } from "./types";

export const UNREACHABLE_MESSAGE = "The server could not be reached. Check your connection, then try again.";

export class ApiError extends Error {
  override readonly name = "ApiError";

  constructor(
    /** HTTP status of the answer; null when there was no answer. */
    readonly status: number | null,
    /** For programs: weather_not_loaded, no_option_chosen, ... */
    readonly code: string,
    message: string,
    /** The field of the request the fault is about, as in roof.obstacles.2.height. */
    readonly field: string | null,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }

  static of(status: number | null, detail: ErrorDetail): ApiError {
    return new ApiError(status, detail.code, detail.message, detail.field ?? null);
  }

  static unreachable(cause: unknown): ApiError {
    return new ApiError(null, "api_unreachable", UNREACHABLE_MESSAGE, null, { cause });
  }

  static unexpected(status: number, cause?: unknown): ApiError {
    const message = "The server did not answer. Try again in a moment.";
    return new ApiError(status, "unexpected_answer", message, null, { cause });
  }
}

/** What the API says is wrong, or null when *value* is not an error of the API. */
export function detailOf(value: unknown): ErrorDetail | null {
  if (typeof value !== "object" || value === null || !("error" in value)) return null;
  const error = value.error;
  if (typeof error !== "object" || error === null) return null;
  const { code, message, field } = error as Record<string, unknown>;
  if (typeof code !== "string" || typeof message !== "string") return null;
  return { code, message, field: typeof field === "string" ? field : null };
}

/** The error of an answer that is not a success. */
export async function errorOf(response: Response): Promise<ApiError> {
  let body: unknown;
  try {
    body = await response.json();
  } catch (cause) {
    return ApiError.unexpected(response.status, cause);
  }
  const detail = detailOf(body);
  return detail ? ApiError.of(response.status, detail) : ApiError.unexpected(response.status);
}
