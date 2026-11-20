import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, RouterOutlet, provideRouter } from '@angular/router';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { routes } from './app.routes';
import AuthService from './auth.service';
import { of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Title } from '@angular/platform-browser';
import { DailyGetResponse } from '@shared/interfaces/rest_api';

@Component({
  template: '<router-outlet></router-outlet>',
  imports: [RouterOutlet]
})
class RoutingHostComponent {}

describe('app routes (public landing and lore pages)', () => {
  let fixture: ComponentFixture<RoutingHostComponent>;
  let router: Router;
  let authSpy: jasmine.SpyObj<AuthService>;
  let httpMock: HttpTestingController;
  let title: Title;
  const originalHttps = environment.https;

  beforeEach(async () => {
    environment.https = false; // Karma runs on http, so the https redirect guard must not kick in
    authSpy = jasmine.createSpyObj('AuthService', ['check']);
    Object.assign(authSpy, { isLoggedIn: false }); // plain property, as jasmine accessors cannot be reassigned
    authSpy.check.and.returnValue(of(false));

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RoutingHostComponent],
      providers: [provideRouter(routes), { provide: AuthService, useValue: authSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(RoutingHostComponent);
    router = TestBed.inject(Router);
    httpMock = TestBed.inject(HttpTestingController);
    title = TestBed.inject(Title);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    environment.https = originalHttps;
  });

  it('renders the landing page for anonymous visitors at /', fakeAsync(() => {
    router.navigate(['/login']); // leave the root first, so the guard chain runs again on the way back
    tick();
    router.navigate(['/']);
    tick();
    fixture.detectChanges();

    expect(router.url).toBe('/');
    expect(fixture.nativeElement.querySelector('oc-page-landing')).toBeTruthy();
    expect(title.getTitle()).toBe('Outer Colonies – Das Online-Sammelkartenspiel');
  }));

  it('redirects authenticated visitors from / to /home', fakeAsync(() => {
    authSpy.check.and.returnValue(of(true));
    router.navigate(['/login']); // leave the root first, so the guard chain runs again on the way back
    tick();
    router.navigate(['/']);
    tick();
    fixture.detectChanges();

    expect(router.url).toBe('/home');
    expect(fixture.nativeElement.querySelector('oc-page-home')).toBeTruthy();
    httpMock.expectOne(`${environment.url.api}/api/daily`).flush(emptyDailies());
    httpMock.expectOne(`${environment.url.api}/api/online`).flush({ count: 0 });
    fixture.destroy(); // clears the home page auto-advance interval
    tick();
  }));

  it('renders the lore pages publicly for anonymous visitors', fakeAsync(() => {
    const loreRoutes: [string, string, string][] = [
      ['world', 'oc-page-world', 'Outer Colonies – Die Welt'],
      ['factions', 'oc-page-factions', 'Outer Colonies – Die Mächte'],
      ['history', 'oc-page-history', 'Outer Colonies – Die Geschichte'],
      ['editions', 'oc-page-editions', 'Outer Colonies – Die Editionen']
    ];
    for (const [path, selector, pageTitle] of loreRoutes) {
      router.navigate([`/${path}`]);
      tick();
      fixture.detectChanges();

      expect(router.url).toBe(`/${path}`);
      expect(fixture.nativeElement.querySelector(selector)).toBeTruthy();
      expect(title.getTitle()).toBe(pageTitle);
    }
  }));

  it('still redirects anonymous deep links to private routes to /login', fakeAsync(() => {
    router.navigate(['/deck']);
    tick();
    fixture.detectChanges();

    expect(router.url).toBe('/login');
    expect(fixture.nativeElement.querySelector('oc-page-login')).toBeTruthy();
  }));

  it('resolves ?p= deep links to private routes with the /login redirect for anonymous visitors', fakeAsync(() => {
    router.navigate(['/'], { queryParams: { p: 'deck' } });
    tick();
    fixture.detectChanges();

    expect(router.url).toBe('/login');
    expect(fixture.nativeElement.querySelector('oc-page-login')).toBeTruthy();
  }));

  it('resolves ?p= deep links to public lore pages', fakeAsync(() => {
    router.navigate(['/'], { queryParams: { p: 'world' } });
    tick();
    fixture.detectChanges();

    expect(router.url).toBe('/world');
    expect(fixture.nativeElement.querySelector('oc-page-world')).toBeTruthy();
    expect(title.getTitle()).toBe('Outer Colonies – Die Welt');
  }));
});

function emptyDailies(): DailyGetResponse {
  return {
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
  };
}
