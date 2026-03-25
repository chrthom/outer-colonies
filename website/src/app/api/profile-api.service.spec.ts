import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProfileApiService } from './profile-api.service';
import { environment } from 'src/environments/environment';
import AuthService from '../auth.service';

describe('ProfileApiService', () => {
  let service: ProfileApiService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [], { token: 'test-token' });

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProfileApiService, { provide: AuthService, useValue: authServiceSpy }]
    });
    service = TestBed.inject(ProfileApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get profile', () => {
    const testToken = 'test-token';
    const mockProfile = { username: 'testuser', sol: 100, newsletter: true };

    service.profile.subscribe(profile => {
      expect(profile).toEqual(mockProfile);
    });

    const req = httpMock.expectOne(`${environment.url.api}/api/profile`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('session-token')).toBe(testToken);
    req.flush(mockProfile);
  });

  it('should set newsletter subscription', () => {
    const testToken = 'test-token';

    service.setNewsletter(true).subscribe(() => {
      // Newsletter set successfully
    });

    const req = httpMock.expectOne(`${environment.url.api}/api/profile/newsletter`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.headers.get('session-token')).toBe(testToken);
    req.flush({});
  });

  it('should unset newsletter subscription', () => {
    const testToken = 'test-token';

    service.setNewsletter(false).subscribe(() => {
      // Newsletter unset successfully
    });

    const req = httpMock.expectOne(`${environment.url.api}/api/profile/newsletter`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.headers.get('session-token')).toBe(testToken);
    req.flush({});
  });
});
