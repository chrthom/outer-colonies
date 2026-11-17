import { HttpErrorResponse } from '@angular/common/http';
import { GenericResponse } from '@shared/interfaces/rest_api';

/**
 * Typed error for failed API calls, exposed to pages by the API error
 * interceptor so they can map status and message to their German UI strings.
 */
export class ApiError extends Error {
  /** HTTP status code of the failed response (0 for network errors). */
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }

  /**
   * Creates an `ApiError` from a failed HTTP response, preferring the
   * `GenericResponse` message of the API error body over the generic
   * HttpClient status text.
   */
  static fromHttpResponse(response: HttpErrorResponse): ApiError {
    const body = response.error as GenericResponse | null | undefined;
    return new ApiError(response.status, body?.message ?? response.message);
  }
}
