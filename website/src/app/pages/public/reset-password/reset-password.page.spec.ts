import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ResetPasswordPage } from './reset-password.page';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import AuthApiService from 'src/app/api/auth-api.service';
import { of, Subject, throwError } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';

describe('ResetPasswordPage', () => {
  let component: ResetPasswordPage;
  let fixture: ComponentFixture<ResetPasswordPage>;
  let authApiSpy: jasmine.SpyObj<AuthApiService>;
  let routeSpy: any;

  beforeEach(async () => {
    authApiSpy = jasmine.createSpyObj('AuthApiService', ['resetPasswordViaMagicLink']);

    routeSpy = {
      paramMap: of({
        get: () => 'test-reset-id'
      })
    };

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
      providers: [
        { provide: AuthApiService, useValue: authApiSpy },
        { provide: ActivatedRoute, useValue: routeSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPasswordPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component.resetPasswordForm.value).toEqual({
      password: ''
    });
  });

  it('should extract reset ID from route on init', () => {
    expect(component.resetId).toBe('test-reset-id');
  });

  it('should make password field required with length validation', () => {
    const password = component.password;
    password?.setValue('');
    expect(password?.valid).toBeFalse();

    password?.setValue('short');
    expect(password?.valid).toBeFalse();

    password?.setValue('nodigitshere');
    expect(password?.valid).toBeFalse();

    password?.setValue('validpassword123');
    expect(password?.valid).toBeTrue();

    password?.setValue('a'.repeat(41));
    expect(password?.valid).toBeFalse();
  });

  it('should not submit when form is invalid', () => {
    component.resetPasswordForm.setValue({ password: '' });
    component.submit();
    expect(authApiSpy.resetPasswordViaMagicLink).not.toHaveBeenCalled();
    expect(component.loading).toBeFalse();
  });

  it('should submit when form is valid', () => {
    authApiSpy.resetPasswordViaMagicLink.and.returnValue(of(undefined));
    component.resetPasswordForm.setValue({ password: 'validpassword123' });
    component.submit();

    expect(authApiSpy.resetPasswordViaMagicLink).toHaveBeenCalledWith('test-reset-id', 'validpassword123');
    expect(component.loading).toBeTrue();
  });

  it('should set success state on successful password reset', () => {
    const freshFixture = TestBed.createComponent(ResetPasswordPage);
    const freshComponent = freshFixture.componentInstance;

    authApiSpy.resetPasswordViaMagicLink.and.returnValue(of(undefined));

    freshComponent.resetPasswordForm.setValue({ password: 'validpassword123' });
    freshComponent.submit();

    expect(freshComponent.passwordResetSuccessful).toBeTrue();
    expect(freshComponent.passwordResetFailed).toBeFalse();
  });

  it('should set failure state on password reset error', () => {
    const freshFixture = TestBed.createComponent(ResetPasswordPage);
    const freshComponent = freshFixture.componentInstance;

    authApiSpy.resetPasswordViaMagicLink.and.returnValue(throwError(() => new Error('Reset failed')));

    freshComponent.resetPasswordForm.setValue({ password: 'validpassword123' });
    freshComponent.submit();

    expect(freshComponent.passwordResetSuccessful).toBeFalse();
    expect(freshComponent.passwordResetFailed).toBeTrue();
    expect(freshComponent.loading).toBeFalse();
  });

  it('should not submit when already loading', () => {
    component.loading = true;
    authApiSpy.resetPasswordViaMagicLink.and.returnValue(of(undefined));
    component.resetPasswordForm.setValue({ password: 'validpassword123' });
    component.submit();

    expect(authApiSpy.resetPasswordViaMagicLink).not.toHaveBeenCalled();
  });

  it('should keep the submit button primary and disable it only while loading', () => {
    component.resetPasswordForm.setValue({ password: '' });
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

    expect(fixture.nativeElement.querySelector('mat-error')).not.toBeNull();
    expect(authApiSpy.resetPasswordViaMagicLink).not.toHaveBeenCalled();
  });
  it('should expose the corrected heading and new-password autocomplete', () => {
    expect(fixture.nativeElement.querySelectorAll('h1').length).toBe(1);
    expect(fixture.nativeElement.querySelector('h1').textContent).toBe('Neues Passwort setzen');
    expect(fixture.nativeElement.querySelector('input').autocomplete).toBe('new-password');
  });

  it('should announce reset failure without nested live regions', () => {
    authApiSpy.resetPasswordViaMagicLink.and.returnValue(throwError(() => new Error('Expired')));
    component.resetPasswordForm.setValue({ password: 'password123' });
    component.submit();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'neuen Passwort-Link'
    );
    expect(fixture.nativeElement.querySelector('[role="alert"] mat-error')).toBeNull();
  });
  it('should prevent concurrent reset requests and restore retry after failure', () => {
    const request = new Subject<void>();
    authApiSpy.resetPasswordViaMagicLink.and.returnValue(request);
    component.resetPasswordForm.setValue({ password: 'password123' });
    component.submit();
    component.submit();
    expect(authApiSpy.resetPasswordViaMagicLink).toHaveBeenCalledTimes(1);
    request.error(new Error('Offline'));
    expect(component.loading).toBeFalse();
    authApiSpy.resetPasswordViaMagicLink.and.returnValue(of(undefined));
    component.submit();
    expect(authApiSpy.resetPasswordViaMagicLink).toHaveBeenCalledTimes(2);
    expect(component.passwordResetSuccessful).toBeTrue();
    expect(component.passwordResetFailed).toBeFalse();
  });
});
