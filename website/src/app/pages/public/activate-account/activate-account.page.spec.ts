import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivateAccountPage } from './activate-account.page';
import { RouterTestingModule } from '@angular/router/testing';
import AuthApiService from 'src/app/api/auth-api.service';
import { of, Subject, throwError } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

describe('ActivateAccountPage', () => {
  let component: ActivateAccountPage;
  let fixture: ComponentFixture<ActivateAccountPage>;
  let authApiSpy: jasmine.SpyObj<AuthApiService>;
  let routeSpy: any;

  beforeEach(async () => {
    authApiSpy = jasmine.createSpyObj('AuthApiService', ['activate']);
    authApiSpy.activate.and.returnValue(of(undefined));

    routeSpy = {
      paramMap: of({
        get: () => 'test-activation-id'
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

    fixture = TestBed.createComponent(ActivateAccountPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default states before ngOnInit', () => {
    // The component calls activate() in ngOnInit, so we need to test before that
    const newFixture = TestBed.createComponent(ActivateAccountPage);
    const newComponent = newFixture.componentInstance;
    // Don't call detectChanges() to avoid triggering ngOnInit
    expect(newComponent.activationSuccessful).toBeFalse();
    expect(newComponent.activationFailed).toBeFalse();
  });

  it('should call activate API on init with route parameter', () => {
    expect(authApiSpy.activate).toHaveBeenCalledWith('test-activation-id');
  });

  it('should set success state on successful activation', () => {
    authApiSpy.activate.and.returnValue(of(undefined));
    component.ngOnInit();

    expect(component.activationSuccessful).toBeTrue();
    expect(component.activationFailed).toBeFalse();
  });

  it('should set failure state on activation error', () => {
    authApiSpy.activate.calls.reset();
    authApiSpy.activate.and.returnValue(throwError(() => new Error('Activation failed')));

    const newFixture = TestBed.createComponent(ActivateAccountPage);
    const newComponent = newFixture.componentInstance;
    newFixture.detectChanges(); // This triggers ngOnInit

    expect(newComponent.activationSuccessful).toBeFalse();
    expect(newComponent.activationFailed).toBeTrue();
  });

  it('should handle null activation ID gracefully', () => {
    routeSpy.paramMap = of({
      get: () => null
    });

    // Recreate component to pick up new route spy
    fixture = TestBed.createComponent(ActivateAccountPage);
    component = fixture.componentInstance;

    expect(() => component.ngOnInit()).not.toThrow();
  });
  it('should announce pending activation followed by success', () => {
    const request = new Subject<void>();
    authApiSpy.activate.and.returnValue(request);
    component.ngOnInit();
    fixture.detectChanges();
    expect(component.loading).toBeTrue();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('wird aktiviert');
    expect(fixture.nativeElement.querySelectorAll('h1').length).toBe(1);
    request.next();
    request.complete();
    fixture.detectChanges();
    expect(component.loading).toBeFalse();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('wurde aktiviert');
  });

  it('should announce the corrected failure text after pending activation', () => {
    const request = new Subject<void>();
    authApiSpy.activate.and.returnValue(request);
    component.ngOnInit();
    request.error(new Error('Expired'));
    fixture.detectChanges();
    expect(component.loading).toBeFalse();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain(
      'Der übertragene Aktivierungscode'
    );
  });
});
