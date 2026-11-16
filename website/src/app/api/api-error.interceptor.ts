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
 * - On HTTP 401 the session is cleared and the user is redirected to the
 *   login page (replaces the ad-hoc retry logic formerly in `AuthService.check`).
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
      if (apiError.status === 401) {
        authService.clearSession();
        router.navigate(['/login']);
      }
      return throwError(() => apiError);
    })
  );
};
