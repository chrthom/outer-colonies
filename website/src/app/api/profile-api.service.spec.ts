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
    const mockProfile = { username: 'testuser', sol: 100, newsletter: true };

    service.profile.subscribe(profile => {
      expect(profile).toEqual(mockProfile);
    });

    const req = httpMock.expectOne(`${environment.url.api}/api/profile`);
    expect(req.request.method).toBe('GET');
    req.flush(mockProfile);
  });

  it('should set newsletter subscription', () => {
    service.setNewsletter(true).subscribe(() => {
      // Newsletter set successfully
    });

    const req = httpMock.expectOne(`${environment.url.api}/api/profile/newsletter`);
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('should unset newsletter subscription', () => {
    service.setNewsletter(false).subscribe(() => {
      // Newsletter unset successfully
    });

    const req = httpMock.expectOne(`${environment.url.api}/api/profile/newsletter`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
