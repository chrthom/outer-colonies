import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavbarComponent } from './navbar.component';
import { RouterTestingModule } from '@angular/router/testing';
import AuthService from 'src/app/auth.service';
import { of } from 'rxjs';
import { MatTooltipModule } from '@angular/material/tooltip';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj('AuthService', ['logout'], { displayname: 'testuser' });

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, MatTooltipModule],
      providers: [{ provide: AuthService, useValue: authSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
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

  it('should get active route', () => {
    // This is a basic test - more comprehensive routing tests would be needed
    expect(component.active).toBeDefined();
  });
});
