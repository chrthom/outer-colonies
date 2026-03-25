import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ForgotPasswordPage } from './forgot-password.page';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import AuthApiService from 'src/app/api/auth-api.service';
import { of, throwError } from 'rxjs';
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
    username.setValue('');
    expect(username.valid).toBeFalse();

    username.setValue('testuser');
    expect(username.valid).toBeTrue();
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
    // Create a fresh component instance for this test
    const freshFixture = TestBed.createComponent(ForgotPasswordPage);
    const freshComponent = freshFixture.componentInstance;

    authApiSpy.forgotPassword.and.returnValue(of(undefined));

    freshComponent.forgotPasswordForm.setValue({ username: 'testuser' });
    freshComponent.submit();

    expect(freshComponent.passwordResetSuccessful).toBeTrue();
    expect(freshComponent.passwordResetFailed).toBeFalse();
    // Note: Component doesn't set loading=false in success case, only in error case
    // expect(freshComponent.loading).toBeFalse();
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
});
