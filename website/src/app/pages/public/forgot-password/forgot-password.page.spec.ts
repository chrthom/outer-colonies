import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ForgotPasswordPage } from './forgot-password.page';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import AuthApiService from 'src/app/api/auth-api.service';
import { of, Subject, throwError } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('ForgotPasswordPage', () => {
  let component: ForgotPasswordPage;
  let fixture: ComponentFixture<ForgotPasswordPage>;
  let authApiSpy: jasmine.SpyObj<AuthApiService>;

  beforeEach(async () => {
    authApiSpy = jasmine.createSpyObj('AuthApiService', ['forgotPassword']);
    authApiSpy.forgotPassword.and.returnValue(of(undefined));

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
      providers: [{ provide: AuthApiService, useValue: authApiSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component.forgotPasswordForm.value).toEqual({
      username: ''
    });
  });

  it('should make username field required', () => {
    const username = component.username;
    username?.setValue('');
    expect(username?.valid).toBeFalse();

    username?.setValue('testuser');
    expect(username?.valid).toBeTrue();
  });

  it('should not submit when form is invalid', () => {
    component.forgotPasswordForm.setValue({ username: '' });
    component.submit();
    expect(authApiSpy.forgotPassword).not.toHaveBeenCalled();
    expect(component.loading).toBeFalse();
  });

  it('should trim username before submission', () => {
    authApiSpy.forgotPassword.and.returnValue(of(undefined));
    component.forgotPasswordForm.setValue({ username: '  testuser  ' });
    component.submit();

    expect(authApiSpy.forgotPassword).toHaveBeenCalledWith('testuser');
  });

  it('should submit when form is valid', () => {
    authApiSpy.forgotPassword.and.returnValue(of(undefined));
    component.forgotPasswordForm.setValue({ username: 'testuser' });
    component.submit();

    expect(authApiSpy.forgotPassword).toHaveBeenCalledWith('testuser');
    expect(component.loading).toBeTrue();
  });

  it('should set success state on successful password reset request', () => {
    const freshFixture = TestBed.createComponent(ForgotPasswordPage);
    const freshComponent = freshFixture.componentInstance;

    authApiSpy.forgotPassword.and.returnValue(of(undefined));

    freshComponent.forgotPasswordForm.setValue({ username: 'testuser' });
    freshComponent.submit();

    expect(freshComponent.passwordResetSuccessful).toBeTrue();
    expect(freshComponent.passwordResetFailed).toBeFalse();
  });

  it('should set failure state on password reset request error', () => {
    authApiSpy.forgotPassword.and.returnValue(throwError(() => new Error('Request failed')));
    component.forgotPasswordForm.setValue({ username: 'testuser' });
    component.submit();

    expect(component.passwordResetSuccessful).toBeFalse();
    expect(component.passwordResetFailed).toBeTrue();
    expect(component.loading).toBeFalse();
  });

  it('should not submit when already loading', () => {
    component.loading = true;
    authApiSpy.forgotPassword.and.returnValue(of(undefined));
    component.forgotPasswordForm.setValue({ username: 'testuser' });
    component.submit();

    expect(authApiSpy.forgotPassword).not.toHaveBeenCalled();
  });

  it('should keep the submit button primary and disable it only while loading', () => {
    component.forgotPasswordForm.setValue({ username: '' });
    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css('button[type="submit"]')).componentInstance;

    expect(button.color).toBe('primary');
    expect(button.disabled).toBeFalse();

    component.loading = true;
    fixture.detectChanges();
    expect(button.color).toBe('primary');
    expect(button.disabled).toBeTrue();
  });

  it('should show the required error after submitting an empty form', () => {
    fixture.debugElement.query(By.css('form')).triggerEventHandler('ngSubmit', null);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('mat-error')?.textContent).toContain('Bitte gib deinen');
    expect(authApiSpy.forgotPassword).not.toHaveBeenCalled();
  });
  it('should preserve email recovery as well as username recovery', () => {
    component.forgotPasswordForm.setValue({ username: '  player@example.com  ' });
    component.submit();
    expect(authApiSpy.forgotPassword).toHaveBeenCalledWith('player@example.com');
    expect(component.passwordResetSuccessful).toBeTrue();
  });

  it('should expose text recovery semantics, one heading and a login back link', () => {
    const element = fixture.nativeElement;
    expect(element.querySelectorAll('h1').length).toBe(1);
    const input = element.querySelector('input');
    expect(input.type).toBe('text');
    expect(input.autocomplete).toBe('username');
    expect(element.querySelector('#back-link a').getAttribute('href')).toBe('/login');
  });

  it('should announce a failed request without nested live regions', () => {
    authApiSpy.forgotPassword.and.returnValue(throwError(() => new Error('Offline')));
    component.forgotPasswordForm.setValue({ username: 'testuser' });
    component.submit();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('nicht gefunden');
    expect(fixture.nativeElement.querySelector('[role="alert"] mat-error')).toBeNull();
  });
  it('should prevent concurrent recovery requests and restore retry after failure', () => {
    const request = new Subject<void>();
    authApiSpy.forgotPassword.and.returnValue(request);
    component.forgotPasswordForm.setValue({ username: 'testuser' });
    component.submit();
    component.submit();
    expect(authApiSpy.forgotPassword).toHaveBeenCalledTimes(1);
    request.error(new Error('Offline'));
    expect(component.loading).toBeFalse();
    authApiSpy.forgotPassword.and.returnValue(of(undefined));
    component.submit();
    expect(authApiSpy.forgotPassword).toHaveBeenCalledTimes(2);
    expect(component.passwordResetSuccessful).toBeTrue();
    expect(component.passwordResetFailed).toBeFalse();
  });
});
