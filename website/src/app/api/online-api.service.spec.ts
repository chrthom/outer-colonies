import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OnlineApiService } from './online-api.service';
import { environment } from 'src/environments/environment';

describe('OnlineApiService', () => {
  let service: OnlineApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OnlineApiService]
    });
    service = TestBed.inject(OnlineApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should get the online count', () => {
    let count: number | undefined;
    service.online.subscribe(res => (count = res.count));

    const req = httpMock.expectOne(`${environment.url.api}/api/online`);
    expect(req.request.method).toBe('GET');
    req.flush({ count: 12 });

    expect(count).toBe(12);
  });
});
