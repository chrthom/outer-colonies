import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HomePage } from './home.page';
import { DailyApiService } from 'src/app/api/daily-api.service';
import AuthService from 'src/app/auth.service';
import { DailyGetResponse } from '@shared/interfaces/rest_api';
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
    // Requests a test does not care about (dailies in the online count tests and vice versa)
    // are answered here, so verify() only catches truly unexpected ones
    httpMock.match(`${environment.url.api}/api/online`).forEach(req => req.flush({ count: 0 }));
    httpMock.match(`${environment.url.api}/api/daily`).forEach(req => req.flush({}));
    httpMock.verify();
  });

  it('should initialize with all 13 dailies before reload filters them', () => {
    expect(component.dailies.length).toBe(13);
  });

  it('should log a warning and keep the default dailies list when loading dailies fails', fakeAsync(() => {
    environment.stage = 'development';
    try {
      const warnSpy = spyOn(console, 'warn');
      fixture.detectChanges(); // triggers ngOnInit -> dailies subscription

      const req = httpMock.expectOne(`${environment.url.api}/api/daily`);
      req.flush(
        { status: 500, message: 'Internal Server Error' },
        { status: 500, statusText: 'Internal Server Error' }
      );
      tick();

      expect(warnSpy).toHaveBeenCalledWith(
        jasmine.stringMatching(/status 500.*keeping default dailies list/)
      );
      expect(component.dailies.length).toBe(13);
    } finally {
      environment.stage = 'production';
    }
  }));

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

  it('should cycle auto-advance within the filtered dailies and wrap at their end', fakeAsync(() => {
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
    req.flush(response);
    tick();

    expect(component.dailies.length).toBe(4);
    expect(component.selectedDaily).toBe(1);

    tick(3000);
    expect(component.selectedDaily).toBe(2);

    component.selectedDaily = 3; // Jump to the last filtered tab
    tick(3000);
    expect(component.selectedDaily).toBe(0); // Wraps against the filtered length, not the stale full length

    fixture.destroy();
  }));

  it('should clamp the selected tab into the filtered array after reload', fakeAsync(() => {
    fixture.detectChanges();

    const response: DailyGetResponse = {
      login: true,
      victory: null,
      game: null,
      energy: null,
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
    req.flush(response);
    tick();

    expect(component.dailies.length).toBe(1);
    expect(component.selectedDaily).toBe(0); // Initial index 1 is out of bounds and gets clamped

    fixture.destroy();
  }));

  it('should restart the auto-advance interval after reload', fakeAsync(() => {
    const clearIntervalSpy = spyOn(window, 'clearInterval').and.callThrough();
    fixture.detectChanges(); // triggers ngOnInit -> startAutoAdvance
    const callsBeforeReload = clearIntervalSpy.calls.count();

    const req = httpMock.expectOne(`${environment.url.api}/api/daily`);
    req.flush({
      login: true,
      victory: null,
      game: null,
      energy: null,
      ships: null,
      domination: null,
      destruction: null,
      control: null,
      juggernaut: null,
      stations: null,
      discard: null,
      colony: null,
      colossus: null
    });
    tick();

    expect(clearIntervalSpy.calls.count()).toBeGreaterThan(callsBeforeReload);

    fixture.destroy();
  }));

  it('should expose the game URL from the environment', () => {
    expect(component.gameUrl).toContain('game');
  });

  it('should build the game link with the session token as token query parameter', () => {
    expect(component.gameLink).toBe(`${environment.url.game}/?token=test-token`);
  });

  it('should clear the auto-advance interval on destroy', () => {
    const clearIntervalSpy = spyOn(window, 'clearInterval').and.callThrough();
    fixture.detectChanges(); // triggers ngOnInit -> startAutoAdvance
    const req = httpMock.expectOne(`${environment.url.api}/api/daily`);
    req.flush({
      login: null,
      victory: null,
      game: null,
      energy: null,
      ships: null,
      domination: null,
      destruction: null,
      control: null,
      juggernaut: null,
      stations: null,
      discard: null,
      colony: null,
      colossus: null
    });

    fixture.destroy();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('should show the online count after loading it', fakeAsync(() => {
    fixture.detectChanges();
    expect(component.onlineCount).toBeUndefined();

    const req = httpMock.expectOne(`${environment.url.api}/api/online`);
    expect(req.request.method).toBe('GET');
    req.flush({ count: 12 });
    tick();
    fixture.detectChanges();

    expect(component.onlineCount).toBe(12);
    expect(fixture.nativeElement.querySelector('#online-count').textContent).toContain('12 Spieler online');
    fixture.destroy();
  }));

  it('should not show the online count before the first response', fakeAsync(() => {
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#online-count')).toBeNull();
    fixture.destroy();
  }));

  it('should poll the online count every 60 seconds and stop after destroy', fakeAsync(() => {
    fixture.detectChanges();
    httpMock.expectOne(`${environment.url.api}/api/online`).flush({ count: 1 });

    tick(59999);
    httpMock.expectNone(`${environment.url.api}/api/online`);
    tick(1);
    httpMock.expectOne(`${environment.url.api}/api/online`).flush({ count: 5 });
    expect(component.onlineCount).toBe(5);

    fixture.destroy();
    tick(120000);
    httpMock.expectNone(`${environment.url.api}/api/online`);
  }));

  it('should keep the last online count and log a warning when a poll fails', fakeAsync(() => {
    environment.stage = 'development';
    try {
      const warnSpy = spyOn(console, 'warn');
      fixture.detectChanges();
      httpMock.expectOne(`${environment.url.api}/api/online`).flush({ count: 3 });

      tick(60000);
      httpMock
        .expectOne(`${environment.url.api}/api/online`)
        .flush({ status: 500 }, { status: 500, statusText: 'Internal Server Error' });

      expect(component.onlineCount).toBe(3);
      expect(warnSpy).toHaveBeenCalledWith(jasmine.stringMatching(/status 500.*keeping last value/));
      fixture.destroy();
    } finally {
      environment.stage = 'production';
    }
  }));
});
