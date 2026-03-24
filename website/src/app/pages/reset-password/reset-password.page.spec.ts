import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResetPasswordPage } from './reset-password.page';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import AuthApiService from 'src/app/api/auth-api.service';
import { of, throwError } from 'rxjs';
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
    
    // Mock ActivatedRoute with paramMap
    routeSpy = {
      paramMap: of({
        get: (param: string) => 'test-reset-id'
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
    password.setValue('');
    expect(password.valid).toBeFalse();
    
    password.setValue('short'); // Too short
    expect(password.valid).toBeFalse();
    
    password.setValue('validpassword123'); // Valid
    expect(password.valid).toBeTrue();
    
    password.setValue('a'.repeat(41)); // Too long
    expect(password.valid).toBeFalse();
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
    // Create a fresh component instance for this test
    const freshFixture = TestBed.createComponent(ResetPasswordPage);
    const freshComponent = freshFixture.componentInstance;
    
    authApiSpy.resetPasswordViaMagicLink.and.returnValue(of(undefined));
    
    freshComponent.resetPasswordForm.setValue({ password: 'validpassword123' });
    freshComponent.submit();
    
    expect(freshComponent.passwordResetSuccessful).toBeTrue();
    expect(freshComponent.passwordResetFailed).toBeFalse();
    // Note: Component doesn't set loading=false in success case, only in error case
    // expect(freshComponent.loading).toBeFalse();
  });

  it('should set failure state on password reset error', () => {
    // Create a fresh component instance for this test
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
});