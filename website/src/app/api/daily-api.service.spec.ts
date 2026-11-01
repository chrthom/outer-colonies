import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DailyApiService } from './daily-api.service';
import { environment } from 'src/environments/environment';

describe('DailyApiService', () => {
  let service: DailyApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DailyApiService]
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
    const mockDailies = {
      login: true,
      victory: false,
      game: true,
      energy: false,
      ships: true,
      domination: false,
      destruction: false,
      control: false,
      juggernaut: false,
      stations: false,
      discard: false,
      colony: false,
      colossus: false
    };

    service.dailies.subscribe(dailies => {
      expect(dailies).toEqual(mockDailies);
    });

    const req = httpMock.expectOne(`${environment.url.api}/api/daily`);
    expect(req.request.method).toBe('GET');
    req.flush(mockDailies);
  });
});
