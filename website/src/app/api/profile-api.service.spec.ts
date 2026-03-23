import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProfileApiService } from './profile-api.service';
import { environment } from 'src/environments/environment';

describe('ProfileApiService', () => {
  let service: ProfileApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProfileApiService]
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

    const req = httpMock.expectOne(`${environment.url.api}/profile`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${testToken}`);
    req.flush(mockProfile);
  });

  it('should set newsletter subscription', () => {
    const testToken = 'test-token';

    service.setNewsletter(true).subscribe(() => {
      // Newsletter set successfully
    });

    const req = httpMock.expectOne(`${environment.url.api}/profile/newsletter`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${testToken}`);
    req.flush({});
  });

  it('should unset newsletter subscription', () => {
    const testToken = 'test-token';

    service.setNewsletter(false).subscribe(() => {
      // Newsletter unset successfully
    });

    const req = httpMock.expectOne(`${environment.url.api}/profile/newsletter`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${testToken}`);
    req.flush({});
  });
});
