import { TestBed } from '@angular/core/testing';
import { CookieService } from 'ngx-cookie-service';
import AuthService from './auth.service';
import AuthApiService from './api/auth-api.service';
import { environment } from 'src/environments/environment';
import { of, Subject, throwError } from 'rxjs';
import { AuthLoginResponse } from '@shared/interfaces/rest_api';

describe('AuthService', () => {
  let service: AuthService;
  let authApiSpy: jasmine.SpyObj<AuthApiService>;
  let cookieSpy: jasmine.SpyObj<CookieService>;

  beforeEach(() => {
    authApiSpy = jasmine.createSpyObj('AuthApiService', ['login', 'logout', 'checkSessionToken']);
    cookieSpy = jasmine.createSpyObj('CookieService', ['get', 'set', 'delete']);

    cookieSpy.set.and.callFake(() => {
      return undefined;
    });

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: AuthApiService, useValue: authApiSpy },
        { provide: CookieService, useValue: cookieSpy }
      ]
    });

    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should login successfully', () => {
    const mockResponse = { sessionToken: 'test-token', username: 'testuser', email: 'test@example.com' };
    authApiSpy.login.and.returnValue(of(mockResponse));
    cookieSpy.get.and.returnValue('');

    service.login('testuser', 'password', false).subscribe(success => {
      expect(success).toBeTrue();
      expect(service.isLoggedIn).toBeTrue();
      expect(service.displayname).toBe('testuser');
      expect(cookieSpy.set).toHaveBeenCalledWith('u', 'testuser', jasmine.anything());
      expect(cookieSpy.set).toHaveBeenCalledWith('p', 'password', jasmine.anything());
    });
  });

  it('should login with remember me', () => {
    const mockResponse = { sessionToken: 'test-token', username: 'testuser', email: 'test@example.com' };
    authApiSpy.login.and.returnValue(of(mockResponse));

    service.login('testuser', 'password', true).subscribe(success => {
      expect(success).toBeTrue();
      expect(cookieSpy.set).toHaveBeenCalledWith('u', 'testuser', jasmine.anything());
      expect(cookieSpy.set).toHaveBeenCalledWith('p', 'password', jasmine.anything());
    });
  });

  it('should logout', () => {
    service['sessionToken'] = 'test-token';
    authApiSpy.logout.and.returnValue(of(undefined));

    service.logout();
    expect(service.isLoggedIn).toBeFalse();
    expect(cookieSpy.delete).toHaveBeenCalledWith('u');
    expect(cookieSpy.delete).toHaveBeenCalledWith('p');
  });

  it('should log a warning and clear the session locally when the logout call fails', () => {
    environment.stage = 'development';
    try {
      const warnSpy = spyOn(console, 'warn');
      service['sessionToken'] = 'test-token';
      authApiSpy.logout.and.returnValue(throwError(() => ({ status: 500 })));

      service.logout();

      expect(service.isLoggedIn).toBeFalse();
      expect(cookieSpy.delete).toHaveBeenCalledWith('u');
      expect(warnSpy).toHaveBeenCalledWith(jasmine.stringMatching(/status 500/));
    } finally {
      environment.stage = 'production';
    }
  });

  it('should check session token', () => {
    const mockResponse = { sessionToken: 'test-token', username: 'testuser', email: 'test@example.com' };
    service['sessionToken'] = 'test-token';
    authApiSpy.checkSessionToken.and.returnValue(of(mockResponse));

    service.check().subscribe(success => {
      expect(success).toBeTrue();
      expect(service.isLoggedIn).toBeTrue();
    });
  });

  it('should handle failed session check', () => {
    service['sessionToken'] = 'invalid-token';
    authApiSpy.checkSessionToken.and.returnValue(
      throwError(() => ({ status: 401, statusText: 'Unauthorized', url: 'test' }))
    );

    service.check().subscribe(success => {
      expect(success).toBeFalse();
      expect(service.isLoggedIn).toBeFalse();
    });
  });

  it('should not log the failed request URL to the console in production', () => {
    spyOn(console, 'log');
    spyOn(console, 'warn');
    service['sessionToken'] = 'invalid-token';
    authApiSpy.checkSessionToken.and.returnValue(
      throwError(() => ({
        status: 401,
        statusText: 'Unauthorized',
        url: 'https://api.example.com/api/auth/login?email=user%40example.com'
      }))
    );

    service.check().subscribe(success => {
      expect(success).toBeFalse();
      expect(console.log).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  it('should log a warning with the status when the session check fails on non-production stages', () => {
    environment.stage = 'development';
    try {
      const warnSpy = spyOn(console, 'warn');
      service['sessionToken'] = 'invalid-token';
      authApiSpy.checkSessionToken.and.returnValue(throwError(() => ({ status: 401 })));

      service.check().subscribe(success => {
        expect(success).toBeFalse();
        expect(service.isLoggedIn).toBeFalse();
        expect(warnSpy).toHaveBeenCalledWith(jasmine.stringMatching(/status 401/));
        expect(warnSpy).not.toHaveBeenCalledWith(jasmine.stringMatching(/url/i));
      });
    } finally {
      environment.stage = 'production';
    }
  });

  it('should login from cookies', () => {
    const mockResponse = { sessionToken: 'test-token', username: 'testuser', email: 'test@example.com' };
    cookieSpy.get.and.callFake((key: string) => {
      if (key === 'u') return 'testuser';
      if (key === 'p') return 'password';
      return '';
    });
    authApiSpy.login.and.returnValue(of(mockResponse));

    service.check().subscribe(success => {
      expect(success).toBeTrue();
      expect(service.isLoggedIn).toBeTrue();
    });
  });

  it('should return false when no credentials available', () => {
    cookieSpy.get.and.returnValue('');

    service.check().subscribe(success => {
      expect(success).toBeFalse();
    });
  });

  it('should not fall back to cookie credentials when the session-token check fails', () => {
    service['sessionToken'] = 'stale-token';
    cookieSpy.get.and.callFake((key: string) => {
      if (key === 'u') return 'cookieuser';
      if (key === 'p') return 'cookiepass';
      return '';
    });
    authApiSpy.checkSessionToken.and.returnValue(
      throwError(() => ({ status: 401, statusText: 'Unauthorized', url: 'test' }))
    );

    service.check().subscribe(success => {
      expect(success).toBeFalse();
      expect(authApiSpy.login).not.toHaveBeenCalled();
      expect(service.isLoggedIn).toBeFalse();
    });
  });

  it('should clear the session without deleting persisted credentials', () => {
    service['sessionToken'] = 'stale-token';
    service.clearSession();
    expect(service.isLoggedIn).toBeFalse();
    expect(service.displayname).toBe('');
    expect(cookieSpy.delete).not.toHaveBeenCalled();
  });

  it('should not retry when no session token was set and no cookies are available', () => {
    cookieSpy.get.and.returnValue('');
    authApiSpy.login.and.returnValue(
      throwError(() => ({ status: 401, statusText: 'Unauthorized', url: 'test' }))
    );

    service.login('user', 'badpass', false).subscribe(success => {
      expect(success).toBeFalse();
      expect(authApiSpy.login).toHaveBeenCalledTimes(1);
    });
  });

  it('should share a single in-flight check between concurrent callers', () => {
    const response$ = new Subject<AuthLoginResponse>();
    cookieSpy.get.and.callFake((key: string) => (key === 'u' ? 'testuser' : key === 'p' ? 'password' : ''));
    authApiSpy.login.and.returnValue(response$.asObservable());

    const results: boolean[] = [];
    service.check().subscribe(success => results.push(success));
    service.check().subscribe(success => results.push(success));
    expect(authApiSpy.login).toHaveBeenCalledTimes(1); // both callers share one request

    response$.next({ sessionToken: 'shared-token', username: 'testuser', email: 'test@example.com' });
    response$.complete();
    expect(results).toEqual([true, true]);
    expect(service.isLoggedIn).toBeTrue();

    // Once the shared check has settled, the cache is cleared and a new check issues a fresh request:
    authApiSpy.checkSessionToken.and.returnValue(
      of({ sessionToken: 'next-token', username: 'testuser', email: 'test@example.com' })
    );
    service.check().subscribe(success => expect(success).toBeTrue());
    expect(authApiSpy.checkSessionToken).toHaveBeenCalledTimes(1);
  });
});
