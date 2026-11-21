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
import { AppComponent } from './app.component';
import { CookieService } from 'ngx-cookie-service';

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

  for (const loggedIn of [false, true]) {
    for (const [url, expectedUrl, chapter] of [
      ['/rules?section=missions', '/rules?section=missions', 'missions'],
      ['/?p=rules', '/rules', 'setup'],
      ['/?p=rules&section=missions', '/rules?section=missions', 'missions']
    ]) {
      it(`opens ${url} for ${loggedIn ? 'authenticated' : 'anonymous'} visitors`, fakeAsync(() => {
        authSpy.check.and.returnValue(of(loggedIn));
        Object.assign(authSpy, { isLoggedIn: loggedIn });
        router.navigateByUrl(url);
        tick();
        fixture.detectChanges();
        tick();
        fixture.detectChanges();

        expect(router.url).toBe(expectedUrl);
        expect(fixture.nativeElement.querySelector('oc-page-rules')).toBeTruthy();
        expect(
          fixture.nativeElement
            .querySelector(`mat-list-option[value="${chapter}"]`)
            ?.getAttribute('aria-selected')
        ).toBe('true');
        expect(title.getTitle()).toBe('Outer Colonies – Spielregeln');
      }));
    }
  }

  it('preserves other query parameters for public and authenticated private deep links', fakeAsync(() => {
    router.navigateByUrl('/?p=world&from=landing');
    tick();
    expect(router.url).toBe('/world?from=landing');

    authSpy.check.and.returnValue(of(true));
    router.navigateByUrl('/?p=deck&from=landing');
    tick();
    expect(router.url).toBe('/deck?from=landing');
  }));
});

describe('rules session restoration in the app shell', () => {
  const originalHttps = environment.https;

  beforeEach(async () => {
    environment.https = false;
    const cookies = jasmine.createSpyObj<CookieService>('CookieService', ['get', 'set', 'delete']);
    cookies.get.and.callFake(name => (name === 'u' ? 'player' : name === 'p' ? 'password' : ''));
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, AppComponent],
      providers: [provideRouter(routes), { provide: CookieService, useValue: cookies }]
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    environment.https = originalHttps;
  });

  it('restores a saved session on a direct public rules visit', fakeAsync(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const router = TestBed.inject(Router);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    router.navigateByUrl('/rules?section=missions');
    tick();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#navbar-anon-links')).toBeTruthy();

    http
      .expectOne(`${environment.url.api}/api/auth/login`)
      .flush({ sessionToken: 'token', username: 'player' });
    fixture.detectChanges();
    expect(router.url).toBe('/rules?section=missions');
    expect(fixture.nativeElement.querySelector('oc-page-rules')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[aria-label="Spielregeln"][href="/rules"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#navbar-anon-links')).toBeNull();
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
