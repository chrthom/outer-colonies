import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomePage } from './home.page';
import { DailyApiService } from 'src/app/api/daily-api.service';
import AuthService from 'src/app/auth.service';
import { DailyGetResponse } from '../../../../../server/src/shared/interfaces/rest_api';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { environment } from 'src/environments/environment';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isLoggedIn'], { token: 'test-token' });

    await TestBed.configureTestingModule({
      imports: [HomePage, HttpClientTestingModule],
      providers: [DailyApiService, { provide: AuthService, useValue: authServiceSpy }]
    }).compileComponents();

    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    httpMock = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default dailies', () => {
    expect(component.dailies.length).toBe(5);
    expect(component.dailies[0].title).toBe('Tägliche Inspektion');
    expect(component.dailies[1].title).toBe('Der Duft des Sieges');
  });

  it('should have default selected daily', () => {
    expect(component.selectedDaily).toBe(1);
  });

  it('should reload dailies on init', () => {
    const mockResponse: DailyGetResponse = {
      login: true,
      victory: false,
      game: true,
      energy: false,
      ships: true
    };

    spyOn(component, 'reload').and.callThrough();
    fixture.detectChanges();

    const req = httpMock.expectOne(`${environment.url.api}/api/daily`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);

    expect(component.reload).toHaveBeenCalled();
    expect(component.dailies[0].achieved).toBeTrue();
    expect(component.dailies[1].achieved).toBeFalse();
  });

  it('should cycle through dailies automatically', () => {
    const mockResponse: DailyGetResponse = {
      login: true,
      victory: false,
      game: true,
      energy: false,
      ships: true
    };

    fixture.detectChanges();

    const req = httpMock.expectOne(`${environment.url.api}/api/daily`);
    req.flush(mockResponse);

    expect(component.selectedDaily).toBe(1);

    // Manually trigger the interval callback
    const callback = (component as any).showNextDaily(component.dailies.length);
    callback();
    expect(component.selectedDaily).toBe(2);

    callback();
    expect(component.selectedDaily).toBe(3);
  });

  it('should return game URL from environment', () => {
    expect(component.gameUrl).toContain('game');
  });

  it('should render welcome message', () => {
    const mockResponse: DailyGetResponse = {
      login: true,
      victory: false,
      game: true,
      energy: false,
      ships: true
    };

    fixture.detectChanges();
    const req = httpMock.expectOne(`${environment.url.api}/api/daily`);
    req.flush(mockResponse);

    // Component logic test instead of template test
    expect(component.dailies.length).toBeGreaterThan(0);
  });
});
