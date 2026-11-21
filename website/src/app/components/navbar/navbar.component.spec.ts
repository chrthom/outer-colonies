import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavbarComponent } from './navbar.component';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
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
          { path: 'rules', component: TestPageComponent },
          { path: 'profile', component: TestPageComponent }
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
    expect(iconElements.length).toBe(4);
    expect(
      Array.from<Element>(iconElements).every(link => link.getAttribute('href') !== '/profile')
    ).toBeTrue();

    const rightZone = element.querySelector('.right');
    expect(rightZone).toBeTruthy();

    const profileLink = rightZone.querySelector('a.item.profile');
    expect(profileLink).toBeTruthy();
    expect(profileLink.getAttribute('href')).toBe('/profile');
    expect(profileLink.getAttribute('aria-label')).toBe('testuser – Profil verwalten');
    expect(profileLink.querySelector('.user-name')?.textContent).toBe('testuser');
    expect(profileLink.querySelector('img')?.getAttribute('src')).toContain('assets/icons/profile.png');

    expect(element.querySelector('#navbar-anon-actions')).toBeFalsy();
    expect(element.querySelector('#navbar-main').classList.contains('logged-in')).toBeTrue();
    expect(element.querySelector('#navbar-logo')?.classList.contains('compact')).toBeFalse();
    expect(element.querySelector('#navbar-logo').getAttribute('aria-label')).toBe(
      'Outer Colonies – Startseite'
    );
    expect(
      Array.from<Element>(iconElements).every(link => link.tagName === 'A' && link.hasAttribute('aria-label'))
    ).toBeTrue();
    const logout = rightZone.querySelector('button.logout[aria-label="Abmelden"]');
    expect(logout.type).toBe('button');
    logout.click();
    expect(authSpy.logout).toHaveBeenCalled();
    expect(element.querySelector('img:not([alt=""])')).toBeNull();
  });

  it('navigates to /profile when clicking either the username or profile icon and marks it active', async () => {
    const element: HTMLElement = fixture.nativeElement;
    const profileLink = element.querySelector('.right a.item.profile') as HTMLAnchorElement;
    const usernameEl = profileLink.querySelector('.user-name') as HTMLElement;
    const profileIcon = profileLink.querySelector('img') as HTMLImageElement;

    usernameEl.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(router.url).toBe('/profile');
    expect(profileLink.classList.contains('active')).toBeTrue();

    await router.navigateByUrl('/rules');
    fixture.detectChanges();
    expect(profileLink.classList.contains('active')).toBeFalse();

    profileIcon.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(router.url).toBe('/profile');
    expect(profileLink.classList.contains('active')).toBeTrue();
  });

  it('uses fallback aria-label on the profile link when username is unavailable', () => {
    Object.defineProperty(authSpy, 'displayname', { get: () => undefined });
    fixture.detectChanges();

    const profileLink = fixture.nativeElement.querySelector('.right a.item.profile');
    expect(profileLink.getAttribute('aria-label')).toBe('Verwalte dein Profil');
  });

  it('should render only the logo and auth actions without navigation links for anonymous users', () => {
    Object.assign(authSpy, { isLoggedIn: false });
    fixture.detectChanges();

    const element = fixture.nativeElement;
    expect(element.querySelector('#navbar-main').classList.contains('logged-in')).toBeFalse();
    expect(element.querySelector('#navbar-anon-links')).toBeNull();
    expect(element.querySelector('#navbar-menu-toggle')).toBeNull();
    expect(element.querySelector('#navbar-logo')?.getAttribute('href')).toBe('/');

    const actions = Array.from<Element>(element.querySelectorAll('#navbar-anon-actions a'));
    expect(actions.map(a => a.getAttribute('href'))).toEqual(['/register', '/login']);
    expect(actions.map(a => a.textContent?.trim())).toEqual(['Registrieren', 'Einloggen']);
    expect(element.querySelector('.item.center')).toBeFalsy();
    // Both logged-in and anonymous views share the exact same logo sizing and overhanging layout:
    expect(element.querySelector('#navbar-logo')?.classList.contains('compact')).toBeFalse();
  });

  it('should render the decorative energy stream canvas and react to mouse hover without throwing', () => {
    const element: HTMLElement = fixture.nativeElement;
    const bar = element.querySelector('#navbar-main') as HTMLElement;
    const canvas = element.querySelector('canvas.energy-stream') as HTMLCanvasElement;

    expect(canvas).toBeTruthy();
    expect(canvas.getAttribute('aria-hidden')).toBe('true');

    expect(() => {
      bar.dispatchEvent(new MouseEvent('mousemove', { clientX: 250, clientY: 30, bubbles: true }));
      bar.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    }).not.toThrow();
  });
});
