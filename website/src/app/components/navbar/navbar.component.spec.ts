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
        RouterTestingModule.withRoutes([{ path: 'world', component: TestPageComponent }]),
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

  it('should navigate to /login after logout', () => {
    const navigateSpy = spyOn(router, 'navigate');

    component.logout();

    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
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

  it('should render public links and auth buttons for anonymous users', () => {
    Object.assign(authSpy, { isLoggedIn: false });
    fixture.detectChanges();

    const element = fixture.nativeElement;
    const links = Array.from<Element>(element.querySelectorAll('#navbar-anon-links a'));
    expect(links.map(a => a.getAttribute('href'))).toEqual(['/world', '/factions', '/history', '/editions']);
    expect(links.map(a => a.textContent?.trim())).toEqual([
      'Die Welt',
      'Die Mächte',
      'Die Geschichte',
      'Die Editionen'
    ]);

    const actions = Array.from<Element>(element.querySelectorAll('#navbar-anon-actions a'));
    expect(actions.map(a => a.getAttribute('href'))).toEqual(['/register', '/login']);
    expect(actions.map(a => a.textContent?.trim())).toEqual(['Registrieren', 'Login']);
    expect(element.querySelector('.item.center')).toBeFalsy();
    // The compact logo keeps the logo box within the space the anon zone reserves for it:
    expect(element.querySelector('#navbar-logo')?.classList.contains('compact')).toBe(true);
  });
});
