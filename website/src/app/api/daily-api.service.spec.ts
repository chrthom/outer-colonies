import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DailyApiService } from './daily-api.service';
import { environment } from 'src/environments/environment';
import AuthService from '../auth.service';

describe('DailyApiService', () => {
  let service: DailyApiService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [], { token: 'test-token' });
    
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        DailyApiService,
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });
    service = TestBed.inject(DailyApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get dailies', () => {
    const testToken = 'test-token';
    const mockDailies = {
      login: true,
      victory: false,
      game: true,
      energy: false,
      ships: true
    };

    service.dailies.subscribe(dailies => {
      expect(dailies).toEqual(mockDailies);
    });

    const req = httpMock.expectOne(`${environment.url.api}/api/daily`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('session-token')).toBe(testToken);
    req.flush(mockDailies);
  });
});
