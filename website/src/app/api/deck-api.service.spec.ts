import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DeckApiService } from './deck-api.service';
import { environment } from 'src/environments/environment';
import AuthService from '../auth.service';

describe('DeckApiService', () => {
  let service: DeckApiService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [], { token: 'test-token' });
    
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        DeckApiService,
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });
    service = TestBed.inject(DeckApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should list deck', () => {
    const testToken = 'test-token';
    const mockDeck = {
      cards: [
        {
          id: 1,
          cardId: 101,
          inUse: true,
          name: 'Test Card 1',
          type: 'hull' as any,
          discipline: 0 as any,
          rarity: 1,
          canAttack: true,
          profile: { delta: 1, theta: 0, xi: 0, phi: 0, psi: 0, omega: 0, energy: 2 }
        },
        {
          id: 2,
          cardId: 102,
          inUse: false,
          name: 'Test Card 2',
          type: 'equipment' as any,
          discipline: 1 as any,
          rarity: 2,
          canAttack: false,
          profile: { delta: 0, theta: 1, xi: 0, phi: 0, psi: 0, omega: 0, energy: 1 }
        }
      ]
    };

    service.listDeck().subscribe(deck => {
      expect(deck).toEqual(mockDeck);
    });

    const req = httpMock.expectOne(`${environment.url.api}/api/deck`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('session-token')).toBe(testToken);
    req.flush(mockDeck);
  });

  it('should activate card', () => {
    const testToken = 'test-token';
    const cardInstanceId = 1;

    service.activateCard(cardInstanceId).subscribe(() => {
      // Card activated successfully
    });

    const req = httpMock.expectOne(`${environment.url.api}/api/deck/${cardInstanceId}`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('session-token')).toBe(testToken);
    req.flush({});
  });

  it('should deactivate card', () => {
    const testToken = 'test-token';
    const cardInstanceId = 1;

    service.deactivateCard(cardInstanceId).subscribe(() => {
      // Card deactivated successfully
    });

    const req = httpMock.expectOne(`${environment.url.api}/api/deck/${cardInstanceId}`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.headers.get('session-token')).toBe(testToken);
    req.flush({});
  });
});
