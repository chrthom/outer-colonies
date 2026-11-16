import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import AuthApiService from './auth-api.service';
import { environment } from 'src/environments/environment';

describe('AuthApiService', () => {
  let service: AuthApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthApiService]
    });
    service = TestBed.inject(AuthApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should check if username exists', () => {
    const testUsername = 'testuser';
    service.checkUsernameExists(testUsername).subscribe(result => {
      expect(result).toBeFalse();
    });

    const req = httpMock.expectOne(`${environment.url.api}/api/auth/exists?username=${testUsername}`);
    expect(req.request.method).toBe('GET');
    req.flush({ exists: false });
  });

  it('should check if email exists', () => {
    const testEmail = 'test@example.com';
    service.checkEmailExists(testEmail).subscribe(result => {
      expect(result).toBeTrue();
    });

    const req = httpMock.expectOne(`${environment.url.api}/api/auth/exists?email=test@example.com`);
    expect(req.request.method).toBe('GET');
    req.flush({ exists: true });
  });

  it('should URL-encode special characters in the username availability check', () => {
    service.checkUsernameExists('user+name').subscribe(result => {
      expect(result).toBeFalse();
    });

    const req = httpMock.expectOne(`${environment.url.api}/api/auth/exists?username=user%2Bname`);
    expect(req.request.method).toBe('GET');
    req.flush({ exists: false });
  });

  it('should URL-encode special characters in the email availability check', () => {
    service.checkEmailExists('user+tag@example.com').subscribe(result => {
      expect(result).toBeTrue();
    });

    const req = httpMock.expectOne(`${environment.url.api}/api/auth/exists?email=user%2Btag@example.com`);
    expect(req.request.method).toBe('GET');
    req.flush({ exists: true });
  });

  it('should URL-encode query parameters of the exists check', () => {
    const testEmail = 'foo+bar&baz@example.com';
    service.checkEmailExists(testEmail).subscribe(() => {
      // Encoding is verified via the expected request URL below
    });

    const req = httpMock.expectOne(
      `${environment.url.api}/api/auth/exists?email=foo%2Bbar%26baz@example.com`
    );
    expect(req.request.method).toBe('GET');
    req.flush({ exists: true });
  });

  it('should register a new user', () => {
    const testUser = {
      username: 'newuser',
      password: 'password123',
      email: 'new@example.com',
      starterDeck: 1,
      newsletter: false
    };

    service.register(testUser).subscribe(() => {
      // Registration successful
    });

    const req = httpMock.expectOne(`${environment.url.api}/api/auth/register`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(testUser);
    req.flush({});
  });

  it('should login user', () => {
    const testCredentials = { username: 'user', password: 'password' };
    const mockResponse = { sessionToken: 'test-token', username: 'user', email: 'user@example.com' };

    service.login(testCredentials).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.url.api}/api/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(testCredentials);
    req.flush(mockResponse);
  });

  it('should logout user', () => {
    service.logout().subscribe(() => {
      // Logout successful
    });

    const req = httpMock.expectOne(`${environment.url.api}/api/auth/login`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('should request a password reset and URL-encode the user path segment', () => {
    const testEmail = 'foo+bar@example.com';
    service.forgotPassword(testEmail).subscribe(() => {
      // Password reset requested
    });

    const req = httpMock.expectOne(`${environment.url.api}/api/auth/password/foo%2Bbar%40example.com`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
