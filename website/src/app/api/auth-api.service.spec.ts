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

    const req = httpMock.expectOne(`${environment.url.api}/auth/exists?username=${testUsername}`);
    expect(req.request.method).toBe('GET');
    req.flush({ exists: false });
  });

  it('should check if email exists', () => {
    const testEmail = 'test@example.com';
    service.checkEmailExists(testEmail).subscribe(result => {
      expect(result).toBeTrue();
    });

    const req = httpMock.expectOne(`${environment.url.api}/auth/exists?email=${testEmail}`);
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

    const req = httpMock.expectOne(`${environment.url.api}/auth/register`);
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

    const req = httpMock.expectOne(`${environment.url.api}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(testCredentials);
    req.flush(mockResponse);
  });

  it('should logout user', () => {
    const testToken = 'test-token';

    service.logout(testToken).subscribe(() => {
      // Logout successful
    });

    const req = httpMock.expectOne(`${environment.url.api}/auth/login`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${testToken}`);
    req.flush({});
  });
});
