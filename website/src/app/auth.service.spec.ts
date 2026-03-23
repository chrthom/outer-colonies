import { TestBed } from '@angular/core/testing';
import { CookieService } from 'ngx-cookie-service';
import AuthService from './auth.service';
import AuthApiService from './api/auth-api.service';
import { of, throwError } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;
  let authApiSpy: jasmine.SpyObj<AuthApiService>;
  let cookieSpy: jasmine.SpyObj<CookieService>;

  beforeEach(() => {
    authApiSpy = jasmine.createSpyObj('AuthApiService', ['login', 'logout', 'checkSessionToken']);
    cookieSpy = jasmine.createSpyObj('CookieService', ['get', 'set', 'delete']);

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
      expect(cookieSpy.set).toHaveBeenCalledWith('u', 'testuser', jasmine.objectContaining({ expires: 1 }));
      expect(cookieSpy.set).toHaveBeenCalledWith('p', 'password', jasmine.objectContaining({ expires: 1 }));
    });
  });

  it('should login with remember me', () => {
    const mockResponse = { sessionToken: 'test-token', username: 'testuser', email: 'test@example.com' };
    authApiSpy.login.and.returnValue(of(mockResponse));

    service.login('testuser', 'password', true).subscribe(success => {
      expect(success).toBeTrue();
      expect(cookieSpy.set).toHaveBeenCalledWith('u', 'testuser', jasmine.objectContaining({ expires: 100 }));
      expect(cookieSpy.set).toHaveBeenCalledWith('p', 'password', jasmine.objectContaining({ expires: 100 }));
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
});
