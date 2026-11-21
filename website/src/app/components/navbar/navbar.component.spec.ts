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
          { path: 'rules', component: TestPageComponent }
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
    expect(element.querySelector('#navbar-anon-actions')).toBeFalsy();
    expect(element.querySelector('#navbar-main').classList.contains('logged-in')).toBeTrue();
    expect(element.querySelector('#navbar-logo')?.classList.contains('compact')).toBeFalse();
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
});
