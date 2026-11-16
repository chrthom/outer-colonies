import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import AuthService from '../auth.service';
import { ApiError } from './api-error';
import { apiErrorInterceptor } from './api-error.interceptor';

describe('apiErrorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['clearSession']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    Object.defineProperty(routerSpy, 'url', { value: '/deck', writable: true });

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('clears the session and redirects to /login on 401', () => {
    http.get(`${environment.url.api}/api/something`).subscribe({
      error: (err: ApiError) => expect(err.status).toBe(401)
    });

    const req = httpMock.expectOne(`${environment.url.api}/api/something`);
    req.flush({ status: 401, message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(authServiceSpy.clearSession).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('clears the session and redirects to /login on 403 (invalid or expired session token)', () => {
    http.get(`${environment.url.api}/api/something`).subscribe({
      error: (err: ApiError) => expect(err.status).toBe(403)
    });

    const req = httpMock.expectOne(`${environment.url.api}/api/something`);
    req.flush({ status: 403, message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });

    expect(authServiceSpy.clearSession).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('clears the session but does not redirect when already on the login page', () => {
    Object.defineProperty(routerSpy, 'url', { value: '/login', writable: true });
    http.post(`${environment.url.api}/api/auth/login`, {}).subscribe({
      error: (err: ApiError) => expect(err.status).toBe(401)
    });

    const req = httpMock.expectOne(`${environment.url.api}/api/auth/login`);
    req.flush({ status: 401, message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(authServiceSpy.clearSession).toHaveBeenCalled();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('rethrows failed API requests as typed ApiError with status and server message', () => {
    http.get(`${environment.url.api}/api/something`).subscribe({
      error: (err: ApiError) => {
        expect(err instanceof ApiError).toBeTrue();
        expect(err.status).toBe(500);
        expect(err.message).toBe('Something went wrong');
      }
    });

    const req = httpMock.expectOne(`${environment.url.api}/api/something`);
    req.flush(
      { status: 500, message: 'Something went wrong' },
      { status: 500, statusText: 'Internal Server Error' }
    );

    expect(authServiceSpy.clearSession).not.toHaveBeenCalled();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('falls back to the HttpClient message when the error body has none', () => {
    http.get(`${environment.url.api}/api/something`).subscribe({
      error: (err: ApiError) => {
        expect(err.status).toBe(502);
        expect(err.message).toBe(
          `Http failure response for ${environment.url.api}/api/something: 502 Bad Gateway`
        );
      }
    });

    const req = httpMock.expectOne(`${environment.url.api}/api/something`);
    req.flush('', { status: 502, statusText: 'Bad Gateway' });
  });

  it('leaves failed requests to other origins untouched', () => {
    const externalUrl = 'https://example.com/some-resource';
    http.get(externalUrl).subscribe({
      error: (err: HttpErrorResponse) => {
        expect(err instanceof HttpErrorResponse).toBeTrue();
        expect(err.status).toBe(401);
      }
    });

    const req = httpMock.expectOne(externalUrl);
    req.flush({ status: 401, message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(authServiceSpy.clearSession).not.toHaveBeenCalled();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('logs a warning for a 4xx API error on non-production stages', () => {
    environment.stage = 'development';
    try {
      const warnSpy = spyOn(console, 'warn');
      http.get(`${environment.url.api}/api/something`).subscribe({ error: () => undefined });

      const req = httpMock.expectOne(`${environment.url.api}/api/something`);
      req.flush({ status: 401, message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

      expect(warnSpy).toHaveBeenCalledWith(jasmine.stringMatching(/status 401/));
    } finally {
      environment.stage = 'production';
    }
  });

  it('logs an error for a 5xx API error on non-production stages', () => {
    environment.stage = 'development';
    try {
      const errorSpy = spyOn(console, 'error');
      http.get(`${environment.url.api}/api/something`).subscribe({ error: () => undefined });

      const req = httpMock.expectOne(`${environment.url.api}/api/something`);
      req.flush(
        { status: 500, message: 'Internal Server Error' },
        { status: 500, statusText: 'Internal Server Error' }
      );

      expect(errorSpy).toHaveBeenCalledWith(jasmine.stringMatching(/status 500/));
    } finally {
      environment.stage = 'production';
    }
  });

  it('does not log API errors on the production stage', () => {
    const warnSpy = spyOn(console, 'warn');
    const errorSpy = spyOn(console, 'error');
    http.get(`${environment.url.api}/api/something`).subscribe({ error: () => undefined });

    const req = httpMock.expectOne(`${environment.url.api}/api/something`);
    req.flush(
      { status: 500, message: 'Internal Server Error' },
      { status: 500, statusText: 'Internal Server Error' }
    );

    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
