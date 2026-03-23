import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ProfilePage } from './profile.page';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import AuthService from 'src/app/auth.service';
import { ProfileApiService } from 'src/app/api/profile-api.service';
import AuthApiService from 'src/app/api/auth-api.service';
import { of } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('ProfilePage', () => {
  let component: ProfilePage;
  let fixture: ComponentFixture<ProfilePage>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let authApiSpy: jasmine.SpyObj<AuthApiService>;
  let profileApiSpy: jasmine.SpyObj<ProfileApiService>;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj('AuthService', [], { displayname: 'testuser', token: 'test-token' });
    authApiSpy = jasmine.createSpyObj('AuthApiService', ['checkEmailExists', 'resetEmail', 'resetPassword']);
    profileApiSpy = jasmine.createSpyObj('ProfileApiService', ['profile', 'setNewsletter']);

    authApiSpy.checkEmailExists.and.returnValue(of(false));
    authApiSpy.resetEmail.and.returnValue(of(undefined));
    authApiSpy.resetPassword.and.returnValue(of(undefined));
    spyOnProperty(profileApiSpy, 'profile', 'get').and.returnValue(
      of({ newsletter: false, username: 'testuser', sol: 100 })
    );
    profileApiSpy.setNewsletter.and.returnValue(of(undefined));

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        FormsModule,
        RouterTestingModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatSlideToggleModule,
        BrowserAnimationsModule
      ],
      declarations: [],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: AuthApiService, useValue: authApiSpy },
        { provide: ProfileApiService, useValue: profileApiSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfilePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize forms with empty values', () => {
    expect(component.emailForm.value).toEqual({ email: '' });
    expect(component.passwordForm.value).toEqual({ password: '' });
  });

  it('should validate email field', fakeAsync(() => {
    const email = component.emailForm.get('email');
    email?.setValue('');
    expect(email?.valid).toBeFalse();

    email?.setValue('invalid-email');
    tick(500);
    expect(email?.valid).toBeFalse();

    email?.setValue('valid@example.com');
    tick(500);
    expect(email?.valid).toBeTrue();
  }));

  it('should validate password field', () => {
    const password = component.passwordForm.get('password');
    password?.setValue('');
    expect(password?.valid).toBeFalse();

    password?.setValue('short'); // Too short
    expect(password?.valid).toBeFalse();

    password?.setValue('validpassword123');
    expect(password?.valid).toBeTrue();
  });

  it('should get username from auth service', () => {
    expect(component.username).toBe('testuser');
  });

  it('should load newsletter subscription on init', () => {
    expect(component.newsletterSubscription).toBeFalse();
  });

  it('should change email on valid form submit', () => {
    component.emailForm.setValue({ email: 'new@example.com' });
    component.changeEmail();
    expect(authApiSpy.resetEmail).toHaveBeenCalledWith('test-token', 'new@example.com');
    expect(component.emailResetSuccessful).toBeTrue();
  });

  it('should not change email on invalid form submit', () => {
    component.emailForm.setValue({ email: 'invalid-email' });
    component.changeEmail();
    expect(authApiSpy.resetEmail).not.toHaveBeenCalled();
    expect(component.emailResetSuccessful).toBeFalse();
  });

  it('should change password on valid form submit', () => {
    component.passwordForm.setValue({ password: 'newpassword123' });
    component.changePassword();
    expect(authApiSpy.resetPassword).toHaveBeenCalledWith('test-token', 'newpassword123');
    expect(component.passwordResetSuccessful).toBeTrue();
  });

  it('should not change password on invalid form submit', () => {
    component.passwordForm.setValue({ password: 'short' });
    component.changePassword();
    expect(authApiSpy.resetPassword).not.toHaveBeenCalled();
    expect(component.passwordResetSuccessful).toBeFalse();
  });

  it('should change newsletter subscription', () => {
    component.newsletterSubscription = true;
    component.changeNewsletter();
    expect(profileApiSpy.setNewsletter).toHaveBeenCalledWith(true);
  });
});
