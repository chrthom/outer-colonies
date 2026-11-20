import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavbarComponent } from './navbar.component';
import { RouterTestingModule } from '@angular/router/testing';
import { Router, UrlTree } from '@angular/router';
import AuthService from 'src/app/auth.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Component } from '@angular/core';

@Component({ template: '' })
class TestPageComponent {}

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj('AuthService', ['logout'], { displayname: 'testuser' });
    Object.assign(authSpy, { isLoggedIn: true }); // plain property, as jasmine accessors cannot be reassigned

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([
          { path: '', component: TestPageComponent },
          { path: 'world', component: TestPageComponent },
          { path: 'factions', component: TestPageComponent },
          {
            path: 'history',
            component: TestPageComponent,
            canActivate: [() => TestBed.inject(Router).parseUrl('/world')]
          },
          { path: 'editions', component: TestPageComponent, canActivate: [() => false] }
        ]),
        MatTooltipModule
      ],
      providers: [{ provide: AuthService, useValue: authSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get username from auth service', () => {
    expect(component.username).toBe('testuser');
  });

  it('should call auth service logout on logout', () => {
    component.logout();
    expect(authSpy.logout).toHaveBeenCalled();
  });

  it('should navigate to the public landing page after logout', () => {
    const navigateSpy = spyOn(router, 'navigate');

    component.logout();

    expect(navigateSpy).toHaveBeenCalledWith(['/']);
  });

  it('should get active route', () => {
    expect(component.active).toBeDefined();
  });

  it('should render the icon navbar for logged-in users', () => {
    const element = fixture.nativeElement;
    const iconElements = element.querySelectorAll('.item.center');
    expect(iconElements.length).toBe(5);
    expect(element.querySelector('.user-name')?.textContent).toBe('testuser');
    expect(element.querySelector('#navbar-anon-links')).toBeFalsy();
    expect(element.querySelector('#navbar-main').classList.contains('logged-in')).toBeTrue();
    expect(element.querySelector('#navbar-logo')?.classList.contains('compact')).toBe(false);
    expect(element.querySelector('#navbar-logo').getAttribute('aria-label')).toBe(
      'Outer Colonies – Startseite'
    );
    expect(
      Array.from<Element>(iconElements).every(link => link.tagName === 'A' && link.hasAttribute('aria-label'))
    ).toBeTrue();
    const logout = element.querySelector('button[aria-label="Abmelden"]');
    expect(logout.type).toBe('button');
    logout.click();
    expect(authSpy.logout).toHaveBeenCalled();
    expect(element.querySelector('img:not([alt=""])')).toBeNull();
  });

  it('toggles the accessible mobile menu and restores focus on Escape', () => {
    Object.assign(authSpy, { isLoggedIn: false });
    fixture.detectChanges();
    const toggle: HTMLButtonElement = fixture.nativeElement.querySelector('#navbar-menu-toggle');
    const nav: HTMLElement = fixture.nativeElement.querySelector('#navbar-anon-links');
    toggle.style.display = 'block';
    expect(toggle.getAttribute('aria-controls')).toBe(nav.id);
    expect(nav.getAttribute('aria-label')).toBe('Hauptnavigation');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    toggle.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(nav.classList.contains('open')).toBeTrue();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(nav.classList.contains('open')).toBeFalse();
    expect(document.activeElement).toBe(toggle);
  });

  it('closes the menu when navigation starts, including navigation from elsewhere', async () => {
    Object.assign(authSpy, { isLoggedIn: false });
    fixture.detectChanges();
    fixture.nativeElement.querySelector('#navbar-menu-toggle').click();
    fixture.detectChanges();
    expect(component.menuOpen).toBeTrue();
    await router.navigateByUrl('/world');
    fixture.detectChanges();
    expect(component.menuOpen).toBeFalse();
    expect(fixture.nativeElement.querySelector('#navbar-menu-toggle').getAttribute('aria-expanded')).toBe(
      'false'
    );
  });

  it('moves focus out of the menu and requests content focus after keyboard navigation', async () => {
    Object.assign(authSpy, { isLoggedIn: false });
    fixture.detectChanges();
    const toggle: HTMLButtonElement = fixture.nativeElement.querySelector('#navbar-menu-toggle');
    const nav: HTMLElement = fixture.nativeElement.querySelector('#navbar-anon-links');
    toggle.style.display = 'block';
    toggle.click();
    fixture.detectChanges();
    const link: HTMLAnchorElement = nav.querySelector('a[href="/world"]')!;
    link.focus();
    expect(document.activeElement).toBe(link);
    const onMenuNavigation = jasmine.createSpy('onMenuNavigation');
    component.menuNavigation.subscribe(onMenuNavigation);

    await router.navigateByUrl('/world');
    fixture.detectChanges();

    expect(document.activeElement).toBe(toggle);
    expect(component.menuOpen).toBeFalse();
    expect(onMenuNavigation).toHaveBeenCalledTimes(1);
  });

  it('closes the menu and restores focus when the selected page is already active', async () => {
    await router.navigateByUrl('/world');
    Object.assign(authSpy, { isLoggedIn: false });
    fixture.detectChanges();
    const toggle: HTMLButtonElement = fixture.nativeElement.querySelector('#navbar-menu-toggle');
    toggle.style.display = 'block';
    toggle.click();
    fixture.detectChanges();
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector(
      '#navbar-anon-links a[href="/world"]'
    );
    link.focus();
    const onMenuNavigation = jasmine.createSpy('onMenuNavigation');
    component.menuNavigation.subscribe(onMenuNavigation);

    await router.navigateByUrl('/world');
    fixture.detectChanges();

    expect(component.menuOpen).toBeFalse();
    expect(document.activeElement).toBe(toggle);
    expect(onMenuNavigation).not.toHaveBeenCalled();
  });

  it('focuses the content after a redirect but not after a canceled navigation', async () => {
    Object.assign(authSpy, { isLoggedIn: false });
    fixture.detectChanges();
    const toggle: HTMLButtonElement = fixture.nativeElement.querySelector('#navbar-menu-toggle');
    toggle.style.display = 'block';
    const onMenuNavigation = jasmine.createSpy('onMenuNavigation');
    component.menuNavigation.subscribe(onMenuNavigation);
    toggle.click();
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector('#navbar-anon-links a[href="/history"]') as HTMLAnchorElement
    ).focus();

    await router.navigateByUrl('/history');
    fixture.detectChanges();
    expect(router.url).toBe('/world');
    expect(onMenuNavigation).toHaveBeenCalledTimes(1);

    toggle.click();
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector('#navbar-anon-links a[href="/editions"]') as HTMLAnchorElement
    ).focus();
    await router.navigateByUrl('/editions');
    fixture.detectChanges();
    expect(document.activeElement).toBe(toggle);
    expect(onMenuNavigation).toHaveBeenCalledTimes(1);
  });

  it('does not steal focus if the user moves it while navigation is pending', async () => {
    let finishGuard!: (value: boolean | UrlTree) => void;
    let notifyGuardStarted!: () => void;
    const guardStarted = new Promise<void>(resolve => (notifyGuardStarted = resolve));
    router.resetConfig([
      {
        path: 'world',
        component: TestPageComponent,
        canActivate: [
          () =>
            new Promise<boolean | UrlTree>(resolve => {
              finishGuard = resolve;
              notifyGuardStarted();
            })
        ]
      }
    ]);
    Object.assign(authSpy, { isLoggedIn: false });
    fixture.detectChanges();
    const toggle: HTMLButtonElement = fixture.nativeElement.querySelector('#navbar-menu-toggle');
    const register: HTMLAnchorElement = fixture.nativeElement.querySelector('a[href="/register"]');
    toggle.style.display = 'block';
    toggle.click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('#navbar-anon-links a[href="/world"]') as HTMLAnchorElement).focus();
    const onMenuNavigation = jasmine.createSpy('onMenuNavigation');
    component.menuNavigation.subscribe(onMenuNavigation);

    const navigation = router.navigateByUrl('/world');
    await guardStarted;
    register.focus();
    finishGuard(true);
    await navigation;

    expect(document.activeElement).toBe(register);
    expect(onMenuNavigation).not.toHaveBeenCalled();
  });

  it('should render public links and auth buttons for anonymous users', () => {
    Object.assign(authSpy, { isLoggedIn: false });
    fixture.detectChanges();

    const element = fixture.nativeElement;
    expect(element.querySelector('#navbar-main').classList.contains('logged-in')).toBeFalse();
    const links = Array.from<Element>(element.querySelectorAll('#navbar-anon-links a'));
    expect(links.map(a => a.getAttribute('href'))).toEqual([
      '/',
      '/world',
      '/factions',
      '/history',
      '/editions'
    ]);
    expect(links.map(a => a.textContent?.trim())).toEqual([
      'Startseite',
      'Die Welt',
      'Die Mächte',
      'Die Geschichte',
      'Die Editionen'
    ]);

    const actions = Array.from<Element>(element.querySelectorAll('#navbar-anon-actions a'));
    expect(actions.map(a => a.getAttribute('href'))).toEqual(['/register', '/login']);
    expect(actions.map(a => a.textContent?.trim())).toEqual(['Registrieren', 'Einloggen']);
    expect(element.querySelector('.item.center')).toBeFalsy();
    // The compact logo keeps the logo box within the space the anon zone reserves for it:
    expect(element.querySelector('#navbar-logo')?.classList.contains('compact')).toBe(true);
  });

  it('navigates home from the mobile menu and marks the current page', async () => {
    await router.navigateByUrl('/world');
    Object.assign(authSpy, { isLoggedIn: false });
    fixture.detectChanges();
    const toggle: HTMLButtonElement = fixture.nativeElement.querySelector('#navbar-menu-toggle');
    toggle.style.display = 'block';
    toggle.click();
    fixture.detectChanges();
    const home: HTMLAnchorElement = fixture.nativeElement.querySelector('#navbar-anon-links a[href="/"]');
    home.focus();
    const onMenuNavigation = jasmine.createSpy('onMenuNavigation');
    component.menuNavigation.subscribe(onMenuNavigation);

    home.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.url).toBe('/');
    expect(component.menuOpen).toBeFalse();
    expect(onMenuNavigation).toHaveBeenCalledTimes(1);
    expect(home.getAttribute('aria-current')).toBe('page');
  });
});
