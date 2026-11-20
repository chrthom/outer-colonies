import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmEmailPage } from './confirm-email.page';
import { RouterTestingModule } from '@angular/router/testing';
import AuthApiService from 'src/app/api/auth-api.service';
import { of, Subject, throwError } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

describe('ConfirmEmailPage', () => {
  let component: ConfirmEmailPage;
  let fixture: ComponentFixture<ConfirmEmailPage>;
  let authApiSpy: jasmine.SpyObj<AuthApiService>;
  let routeSpy: any;

  beforeEach(async () => {
    authApiSpy = jasmine.createSpyObj('AuthApiService', ['confirmEmail']);
    authApiSpy.confirmEmail.and.returnValue(of(undefined));

    routeSpy = {
      paramMap: of({
        get: () => 'test-confirmation-id'
      })
    };

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [],
      providers: [
        { provide: AuthApiService, useValue: authApiSpy },
        { provide: ActivatedRoute, useValue: routeSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmEmailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default states before ngOnInit', () => {
    // The component calls confirmEmail() in ngOnInit, so we need to test before that
    const newFixture = TestBed.createComponent(ConfirmEmailPage);
    const newComponent = newFixture.componentInstance;
    // Don't call detectChanges() to avoid triggering ngOnInit
    expect(newComponent.confirmationSuccessful).toBeFalse();
    expect(newComponent.confirmationFailed).toBeFalse();
  });

  it('should call confirmEmail API on init with route parameter', () => {
    expect(authApiSpy.confirmEmail).toHaveBeenCalledWith('test-confirmation-id');
  });

  it('should set success state on successful confirmation', () => {
    authApiSpy.confirmEmail.and.returnValue(of(undefined));
    component.ngOnInit();

    expect(component.confirmationSuccessful).toBeTrue();
    expect(component.confirmationFailed).toBeFalse();
  });

  it('should set failure state on confirmation error', () => {
    authApiSpy.confirmEmail.calls.reset();
    authApiSpy.confirmEmail.and.returnValue(throwError(() => new Error('Confirmation failed')));

    const newFixture = TestBed.createComponent(ConfirmEmailPage);
    const newComponent = newFixture.componentInstance;
    newFixture.detectChanges(); // This triggers ngOnInit

    expect(newComponent.confirmationSuccessful).toBeFalse();
    expect(newComponent.confirmationFailed).toBeTrue();
  });

  it('should handle null confirmation ID gracefully', () => {
    routeSpy.paramMap = of({
      get: () => null
    });

    // Recreate component to pick up new route spy
    fixture = TestBed.createComponent(ConfirmEmailPage);
    component = fixture.componentInstance;

    expect(() => component.ngOnInit()).not.toThrow();
  });
  it('should announce pending confirmation followed by success', () => {
    const request = new Subject<void>();
    authApiSpy.confirmEmail.and.returnValue(request);
    component.ngOnInit();
    fixture.detectChanges();
    expect(component.loading).toBeTrue();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('wird bestätigt');
    expect(fixture.nativeElement.querySelectorAll('h1').length).toBe(1);
    request.next();
    request.complete();
    fixture.detectChanges();
    expect(component.loading).toBeFalse();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('wurde geändert');
  });

  it('should announce the corrected failure text after pending confirmation', () => {
    const request = new Subject<void>();
    authApiSpy.confirmEmail.and.returnValue(request);
    component.ngOnInit();
    request.error(new Error('Expired'));
    fixture.detectChanges();
    expect(component.loading).toBeFalse();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain(
      'Der übertragene Bestätigungscode'
    );
  });
});
