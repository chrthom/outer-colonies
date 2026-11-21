import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
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
      providers: [provideRouter(routes), { provide: AuthService, useValue: authSpy }]
    });
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    environment.https = originalHttps;
  });

  it('loads all secondary pages on demand', () => {
    const secondaryRoutes = routes.filter(route => route.path !== '' && route.path !== '**');
    expect(secondaryRoutes.length).toBe(16);
    for (const route of secondaryRoutes) {
      expect(route.component)
        .withContext(route.path ?? '')
        .toBeUndefined();
      expect(route.loadComponent)
        .withContext(route.path ?? '')
        .toBeDefined();
    }
  });

  it('does not load a private page when its guard rejects navigation', async () => {
    authSpy.check.and.returnValue(of(false));
    const deckRoute = router.config.find(route => route.path === 'deck')!;
    const loadDeck = jasmine.createSpy('loadDeck').and.callFake(deckRoute.loadComponent!);
    router.resetConfig(
      router.config.map(route => (route.path === 'deck' ? { ...route, loadComponent: loadDeck } : route))
    );

    await router.navigate(['/deck']);

    expect(router.url).toBe('/login');
    expect(loadDeck).not.toHaveBeenCalled();
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
