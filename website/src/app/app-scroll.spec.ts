import { provideHttpClient } from '@angular/common/http';
import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { APP_BOOTSTRAP_LISTENER, ApplicationRef, Component } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, RouterOutlet } from '@angular/router';
import { of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { appRouterProviders } from './app.routes';
import AuthService from './auth.service';

@Component({ template: '<router-outlet></router-outlet>', imports: [RouterOutlet] })
class ScrollHostComponent {}

describe('app route scrolling', () => {
  it('returns to the top of the landing page from the bottom of the privacy page', fakeAsync(() => {
    const originalHttps = environment.https;
    environment.https = false;
    try {
      const authSpy = jasmine.createSpyObj('AuthService', ['check']);
      authSpy.check.and.returnValue(of(false));
      TestBed.configureTestingModule({
        imports: [ScrollHostComponent],
        providers: [
          appRouterProviders,
          provideHttpClient(),
          provideNoopAnimations(),
          provideLocationMocks(),
          { provide: AuthService, useValue: authSpy }
        ]
      });

      const fixture = TestBed.createComponent(ScrollHostComponent);
      const appRef = TestBed.inject(ApplicationRef);
      // The router initializes scroll restoration through the application bootstrap listener.
      appRef.components.push(fixture.componentRef);
      fixture.detectChanges();
      for (const listener of TestBed.inject(APP_BOOTSTRAP_LISTENER, [])) {
        listener(fixture.componentRef);
      }
      const router = TestBed.inject(Router);
      router.navigate(['/privacy']);
      tick();
      fixture.detectChanges();

      const link = fixture.nativeElement.querySelector(
        'oc-page-data-privacy a[href="/"]'
      ) as HTMLAnchorElement;
      link.scrollIntoView();
      expect(window.scrollY).toBeGreaterThan(0);
      const privacyPosition = window.scrollY;

      link.click();
      tick();
      fixture.detectChanges();
      tick();

      expect(router.url).toBe('/');
      expect(fixture.nativeElement.querySelector('oc-page-landing')).toBeTruthy();
      expect(window.scrollY).toBe(0);

      TestBed.inject(Location).back();
      // Render the restored route before the router's deferred scroll event runs.
      tick(0, { processNewMacroTasksSynchronously: false });
      fixture.detectChanges();
      tick();
      expect(router.url).toBe('/privacy');
      expect(window.scrollY).toBe(privacyPosition);
    } finally {
      environment.https = originalHttps;
    }
  }));
});
