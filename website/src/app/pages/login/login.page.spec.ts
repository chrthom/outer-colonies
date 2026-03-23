import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginPage } from './login.page';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import AuthService from 'src/app/auth.service';
import { of } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj('AuthService', ['login'], { isLoggedIn: false });
    authSpy.login.and.returnValue(of(true));

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        FormsModule,
        RouterTestingModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        BrowserAnimationsModule
      ],
      declarations: [],
      providers: [{ provide: AuthService, useValue: authSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component.loginForm.value).toEqual({
      username: '',
      password: '',
      remember: false
    });
  });

  it('should make username field required', () => {
    const username = component.loginForm.get('username');
    username?.setValue('');
    expect(username?.valid).toBeFalse();
    username?.setValue('testuser');
    expect(username?.valid).toBeTrue();
  });

  it('should make password field required', () => {
    const password = component.loginForm.get('password');
    password?.setValue('');
    expect(password?.valid).toBeFalse();
    password?.setValue('password123');
    expect(password?.valid).toBeTrue();
  });

  it('should call auth service on valid form submit', () => {
    component.loginForm.setValue({
      username: 'testuser',
      password: 'password123',
      remember: false
    });

    component.submit();
    expect(authSpy.login).toHaveBeenCalledWith('testuser', 'password123', false);
  });

  it('should not call auth service on invalid form submit', () => {
    component.loginForm.setValue({
      username: '',
      password: '',
      remember: false
    });

    component.submit();
    expect(authSpy.login).not.toHaveBeenCalled();
  });

  it('should set loginFailed on failed login', () => {
    authSpy.login.and.returnValue(of(false));
    component.loginForm.setValue({
      username: 'testuser',
      password: 'wrongpassword',
      remember: false
    });

    component.submit();
    expect(component.loginFailed).toBeTrue();
  });
});
