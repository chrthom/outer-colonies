import { TestBed } from '@angular/core/testing';
import { PreloadAllModules, Router, provideRouter, withPreloading } from '@angular/router';
import { of } from 'rxjs';
import { routes } from './app.routes';
import AuthService from './auth.service';
import { environment } from 'src/environments/environment';

describe('app routes', () => {
  let router: Router;
  let authSpy: jasmine.SpyObj<AuthService>;
  const originalHttps = environment.https;

  beforeEach(() => {
    // The spec build runs against environment.ts with https enabled, which would make the
    // guards trigger a window.location protocol redirect; disable it for the tests.
    environment.https = false;
    authSpy = jasmine.createSpyObj('AuthService', ['check']);
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withPreloading(PreloadAllModules)),
        { provide: AuthService, useValue: authSpy }
      ]
    });
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    environment.https = originalHttps;
  });

  it('should activate a private route when the auth check succeeds', async () => {
    authSpy.check.and.returnValue(of(true));

    await router.navigate(['/deck']);

    expect(router.url).toBe('/deck');
  });

  it('should redirect to the login page when the auth check fails on a private route', async () => {
    authSpy.check.and.returnValue(of(false));

    await router.navigate(['/deck']);

    expect(router.url).toBe('/login');
  });

  it('should resolve the ?p= deep link and re-trigger the guard on the target route', async () => {
    authSpy.check.and.returnValue(of(true));

    await router.navigate(['/'], { queryParams: { p: 'deck' } });

    expect(router.url).toBe('/deck');
    expect(authSpy.check).toHaveBeenCalledTimes(1);
  });
});
