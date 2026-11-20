import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, RouterOutlet, provideRouter } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { routes } from './app.routes';
import AuthService from './auth.service';
import { NavbarComponent } from './components/navbar/navbar.component';
import { apiErrorInterceptor } from './api/api-error.interceptor';
import { authTokenInterceptor } from './api/auth-token.interceptor';
import { environment } from 'src/environments/environment';

@Component({
  template: '<oc-navbar></oc-navbar><router-outlet></router-outlet>',
  imports: [NavbarComponent, RouterOutlet]
})
class LogoutRoutingHostComponent {}

describe('logout navigation', () => {
  let fixture: ComponentFixture<LogoutRoutingHostComponent>;
  let router: Router;
  let http: HttpTestingController;
  let auth: AuthService;
  let cookies: jasmine.SpyObj<CookieService>;
  const originalHttps = environment.https;
  const credentials: Record<string, string> = {};
  const authUrl = `${environment.url.api}/api/auth/login`;

  beforeEach(async () => {
    environment.https = false;
    credentials['u'] = '';
    credentials['p'] = '';
    cookies = jasmine.createSpyObj('CookieService', ['get', 'set', 'delete']);
    cookies.get.and.callFake((key: string) => credentials[key] || '');
    cookies.set.and.callFake((key: string, value: string) => (credentials[key] = value));
    cookies.delete.and.callFake((key: string) => delete credentials[key]);
    await TestBed.configureTestingModule({
      imports: [LogoutRoutingHostComponent],
      providers: [
        provideRouter(routes),
        provideHttpClient(withInterceptors([authTokenInterceptor, apiErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: CookieService, useValue: cookies }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(LogoutRoutingHostComponent);
    router = TestBed.inject(Router);
    http = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    environment.https = originalHttps;
  });

  for (const status of [200, 401, 403, 500]) {
    it(`shows the public landing page after logout when the API returns ${status}`, fakeAsync(() => {
      auth.login('testuser', 'password', true).subscribe(success => expect(success).toBeTrue());
      http
        .expectOne(authUrl)
        .flush({ sessionToken: 'test-token', username: 'testuser', email: 'test@example.com' });
      router.navigate(['/rules']);
      tick();
      http
        .expectOne(authUrl)
        .flush({ sessionToken: 'test-token', username: 'testuser', email: 'test@example.com' });
      tick();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('oc-page-rules')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.user-name')).toBeTruthy();

      fixture.nativeElement.querySelector('[matTooltip="Abmelden"]').click();
      const logoutRequest = http.expectOne(authUrl);
      expect(logoutRequest.request.method).toBe('DELETE');
      expect(logoutRequest.request.headers.get('session-token')).toBe('test-token');
      tick();
      fixture.detectChanges();
      if (status === 200) logoutRequest.flush({});
      else logoutRequest.flush({}, { status, statusText: 'Logout failed' });
      tick();
      fixture.detectChanges();

      expect(router.url).toBe('/');
      expect(fixture.nativeElement.querySelector('oc-page-landing')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('#navbar-anon-links')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('oc-page-rules')).toBeFalsy();
      expect(fixture.nativeElement.querySelector('.user-name')).toBeFalsy();
      expect(auth.isLoggedIn).toBeFalse();
      expect(auth.token).toBe('');
      expect(credentials['u']).toBeUndefined();
      expect(credentials['p']).toBeUndefined();
      http.expectNone(authUrl);
    }));
  }

  it('ignores a failed session check that was still in flight when the user logged out', fakeAsync(() => {
    auth.login('testuser', 'password', true).subscribe();
    http
      .expectOne(authUrl)
      .flush({ sessionToken: 'test-token', username: 'testuser', email: 'test@example.com' });
    router.navigate(['/rules']);
    tick();
    http
      .expectOne(authUrl)
      .flush({ sessionToken: 'test-token', username: 'testuser', email: 'test@example.com' });
    tick();
    fixture.detectChanges();

    auth.check().subscribe(result => expect(result).toBeFalse());
    const pendingCheck = http.expectOne(authUrl);
    fixture.nativeElement.querySelector('[matTooltip="Abmelden"]').click();
    const logoutRequest = http.expectOne(authUrl);
    tick();
    fixture.detectChanges();
    pendingCheck.flush({}, { status: 403, statusText: 'Forbidden' });
    logoutRequest.flush({});
    tick();
    fixture.detectChanges();

    expect(router.url).toBe('/');
    expect(fixture.nativeElement.querySelector('oc-page-landing')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#navbar-anon-links')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('oc-page-rules')).toBeFalsy();
    expect(auth.isLoggedIn).toBeFalse();
    expect(credentials['u']).toBeUndefined();
    expect(credentials['p']).toBeUndefined();
  }));
});
