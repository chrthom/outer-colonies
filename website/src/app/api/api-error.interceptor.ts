import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import AuthService from '../auth.service';
import { ApiError } from './api-error';

/**
 * Central error handling for API requests:
 *
 * - Every failed API call is logged once with a level (see the Logging rule in `AGENTS.md`):
 *   `warn` for 4xx (recoverable, e.g. invalid client requests), `error` for 5xx (failures
 *   that need attention). The log is gated to non-production stages and limited to the
 *   status code, because the HttpClient message may embed the request URL (which can
 *   contain query parameters with user data).
 * - On HTTP 401 (no session token provided or failed login) and HTTP 403
 *   (invalid or expired session token, the only 403 the API emits - see
 *   `requireSession` in `server/src/components/rest_api/session_middleware.ts`)
 *   the session is cleared and the user is redirected to the login page
 *   (replaces the ad-hoc retry logic formerly in `AuthService.check`).
 * - Failed API calls are rethrown as typed `ApiError`s (status + message) which
 *   pages can map to their German UI strings.
 */
export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.url.api)) {
    return next(req);
  }
  const authService = inject(AuthService);
  const router = inject(Router);
  return next(req).pipe(
    catchError((response: HttpErrorResponse) => {
      const apiError = ApiError.fromHttpResponse(response);
      if (environment.stage !== 'production') {
        if (apiError.status >= 500) {
          console.error(`API request failed with status ${apiError.status}`);
        } else {
          console.warn(`API request failed with status ${apiError.status}`);
        }
      }
      if (apiError.status === 401 || apiError.status === 403) {
        authService.clearSession();
        if (router.url !== '/login') {
          router.navigate(['/login']);
        }
      }
      return throwError(() => apiError);
    })
  );
};
