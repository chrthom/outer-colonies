import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HomePage } from './home.page';
import { DailyApiService } from 'src/app/api/daily-api.service';
import AuthService from 'src/app/auth.service';
import { DailyGetResponse } from '../../../../../server/src/shared/interfaces/rest_api';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { environment } from 'src/environments/environment';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['isLoggedIn'], { token: 'test-token' });

    await TestBed.configureTestingModule({
      imports: [HomePage, HttpClientTestingModule],
      providers: [DailyApiService, { provide: AuthService, useValue: authServiceSpy }]
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should initialize with all 13 dailies before reload filters them', () => {
    expect(component.dailies.length).toBe(13);
  });

  it('should filter dailies to only those marked available in the response', fakeAsync(() => {
    fixture.detectChanges();

    const response: DailyGetResponse = {
      login: true,
      victory: false,
      game: true,
      energy: false,
      ships: null,
      domination: null,
      destruction: null,
      control: null,
      juggernaut: null,
      stations: null,
      discard: null,
      colony: null,
      colossus: null
    };

    const req = httpMock.expectOne(`${environment.url.api}/api/daily`);
    expect(req.request.method).toBe('GET');
    req.flush(response);

    tick();

    expect(component.dailies.length).toBe(4);
    expect(component.dailies.map(d => d.achieved)).toEqual([true, false, true, false]);
  }));

  it('should expose the game URL from the environment', () => {
    expect(component.gameUrl).toContain('game');
  });
});
