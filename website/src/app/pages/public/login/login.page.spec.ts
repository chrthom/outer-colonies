import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginPage } from './login.page';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import AuthService from 'src/app/auth.service';
import { of, Subject, throwError } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput, MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

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
    router = TestBed.inject(Router);
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

  it('should show the required errors and keep the button primary after submitting an empty form', () => {
    const button = fixture.debugElement.query(By.css('button[type="submit"]')).componentInstance;
    expect(button.color).toBe('primary');

    fixture.debugElement.query(By.css('form')).triggerEventHandler('ngSubmit', null);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('mat-error').length).toBe(2);
    expect(button.color).toBe('primary');
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

  it('should navigate to / on successful login', () => {
    const navigateSpy = spyOn(router, 'navigate');
    component.loginForm.setValue({
      username: 'testuser',
      password: 'password123',
      remember: false
    });

    component.submit();

    expect(navigateSpy).toHaveBeenCalledWith(['/']);
  });

  it('should not navigate on failed login', () => {
    authSpy.login.and.returnValue(of(false));
    const navigateSpy = spyOn(router, 'navigate');
    component.loginForm.setValue({
      username: 'testuser',
      password: 'wrongpassword',
      remember: false
    });

    component.submit();

    expect(navigateSpy).not.toHaveBeenCalled();
  });
  it('should prevent duplicate pending logins and allow retry after failure', () => {
    const request = new Subject<boolean>();
    authSpy.login.and.returnValue(request);
    component.loginForm.setValue({ username: 'testuser', password: 'password123', remember: false });
    component.submit();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBeTrue();
    component.submit();
    expect(authSpy.login).toHaveBeenCalledTimes(1);
    request.next(false);
    request.complete();
    expect(component.loading).toBeFalse();
    expect(component.loginFailed).toBeTrue();
    authSpy.login.and.returnValue(of(true));
    component.submit();
    expect(authSpy.login).toHaveBeenCalledTimes(2);
    expect(component.loading).toBeFalse();
    expect(component.loginFailed).toBeFalse();
  });

  it('should announce request errors and restore retry', () => {
    authSpy.login.and.returnValue(throwError(() => new Error('Offline')));
    component.loginForm.setValue({ username: 'testuser', password: 'password123', remember: false });
    component.submit();
    fixture.detectChanges();
    expect(component.loading).toBeFalse();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('fehlgeschlagen');
    expect(fixture.nativeElement.querySelector('[role="alert"] mat-error')).toBeNull();
  });

  it('should expose a page heading, autocomplete and the intended matchers', () => {
    expect(fixture.nativeElement.querySelectorAll('h1').length).toBe(1);
    expect(fixture.nativeElement.querySelector('[formControlName="username"]').autocomplete).toBe('username');
    expect(fixture.nativeElement.querySelector('[formControlName="password"]').autocomplete).toBe(
      'current-password'
    );
    const inputs = fixture.debugElement.queryAll(By.css('input[matInput]'));
    inputs.forEach(input => expect(input.injector.get(MatInput).errorStateMatcher).toBe(component.matcher));
  });
});
