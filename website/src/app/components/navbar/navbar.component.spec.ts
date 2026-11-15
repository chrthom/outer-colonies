import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavbarComponent } from './navbar.component';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import AuthService from 'src/app/auth.service';
import { MatTooltipModule } from '@angular/material/tooltip';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj('AuthService', ['logout'], { displayname: 'testuser' });
    Object.assign(authSpy, { isLoggedIn: true }); // plain property, as jasmine accessors cannot be reassigned

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, MatTooltipModule],
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
    // This is a basic test - more comprehensive routing tests would be needed
    expect(component.active).toBeDefined();
  });

  it('should render the icon navbar for logged-in users', () => {
    const element = fixture.nativeElement;
    const iconElements = element.querySelectorAll('.navbar-element.navbar-center');
    expect(iconElements.length).toBe(5);
    expect(element.querySelector('.user-name')?.textContent).toBe('testuser');
    expect(element.querySelector('#navbar-anon-links')).toBeFalsy();
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
    expect(element.querySelector('.navbar-element.navbar-center')).toBeFalsy();
  });
});
