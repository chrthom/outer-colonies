import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ItemApiService } from './item-api.service';
import { environment } from 'src/environments/environment';
import AuthService from '../auth.service';

describe('ItemApiService', () => {
  let service: ItemApiService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [], { token: 'test-token' });

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ItemApiService, { provide: AuthService, useValue: authServiceSpy }]
    });
    service = TestBed.inject(ItemApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get items', () => {
    const testToken = 'test-token';
    const mockItems = {
      boosters: [],
      boxes: []
    };

    service.items.subscribe(items => {
      expect(items).toEqual(mockItems);
    });

    const req = httpMock.expectOne(`${environment.url.api}/api/item`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('session-token')).toBe(testToken);
    req.flush(mockItems);
  });

  it('should buy booster', () => {
    const testToken = 'test-token';
    const boosterNo = 1;

    service.buyBooster(boosterNo).subscribe(() => {
      // Booster bought successfully
    });

    const req = httpMock.expectOne(`${environment.url.api}/api/buy/booster/${boosterNo}`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('session-token')).toBe(testToken);
    req.flush({});
  });

  it('should open item', () => {
    const testToken = 'test-token';
    const itemId = 123;
    const mockContent = {
      itemId: 123,
      sol: [100],
      boosters: [1],
      cards: [101]
    };

    service.open(itemId).subscribe(content => {
      expect(content).toEqual(mockContent);
    });

    const req = httpMock.expectOne(`${environment.url.api}/api/item/${itemId}`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('session-token')).toBe(testToken);
    req.flush(mockContent);
  });
});
