import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from 'src/environments/environment';
import AuthService from '../auth.service';

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith(environment.url.api)) {
    const token = inject(AuthService).token;
    if (token) {
      const authReq = req.clone({
        setHeaders: { 'session-token': token }
      });
      return next(authReq);
    }
  }
  return next(req);
};
