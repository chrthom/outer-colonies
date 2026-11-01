import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from 'src/environments/environment';
import AuthService from '../auth.service';
import { authTokenInterceptor } from './auth-token.interceptor';

describe('authTokenInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  function configure(token: string) {
    authServiceSpy = jasmine.createSpyObj('AuthService', [], { token });

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authTokenInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  }

  afterEach(() => {
    httpMock.verify();
  });

  it('adds the session-token header to API requests when a token exists', () => {
    configure('test-token');

    http.get(`${environment.url.api}/api/something`).subscribe();

    const req = httpMock.expectOne(`${environment.url.api}/api/something`);
    expect(req.request.headers.get('session-token')).toBe('test-token');
    req.flush({});
  });

  it('does not add the session-token header when no token is present', () => {
    configure('');

    http.get(`${environment.url.api}/api/something`).subscribe();

    const req = httpMock.expectOne(`${environment.url.api}/api/something`);
    expect(req.request.headers.has('session-token')).toBeFalse();
    req.flush({});
  });

  it('leaves requests to other origins untouched', () => {
    configure('test-token');

    const externalUrl = 'https://example.com/some-resource';
    http.get(externalUrl).subscribe();

    const req = httpMock.expectOne(externalUrl);
    expect(req.request.headers.has('session-token')).toBeFalse();
    req.flush({});
  });
});
