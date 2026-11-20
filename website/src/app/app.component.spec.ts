import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent, LEGAL_PAGE_LOADERS } from './app.component';
import { RouterTestingModule } from '@angular/router/testing';
import AuthService from './auth.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { of } from 'rxjs';
import { By } from '@angular/platform-browser';
import { NavbarComponent } from './components/navbar/navbar.component';
import { environment } from 'src/environments/environment';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let loaders: { imprint: jasmine.Spy; privacy: jasmine.Spy };
  const originalStage = environment.stage;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj('AuthService', ['check'], { displayname: '' });
    Object.assign(authSpy, { isLoggedIn: false }); // plain property, as jasmine accessors cannot be reassigned
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    loaders = {
      imprint: jasmine
        .createSpy('loadImprint')
        .and.callFake(() => import('./pages/public/imprint/imprint.page').then(m => m.ImprintPage)),
      privacy: jasmine
        .createSpy('loadPrivacy')
        .and.callFake(() =>
          import('./pages/public/data-privacy/data-privacy.page').then(m => m.DataPrivacyPage)
        )
    };

    authSpy.check.and.returnValue(of(false));

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, MatDialogModule],
      declarations: [],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: LEGAL_PAGE_LOADERS, useValue: loaders }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    environment.stage = originalStage;
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should check the session once on startup', () => {
    expect(authSpy.check).toHaveBeenCalledTimes(1);
  });

  it('should have a random background number between 0-6', () => {
    expect(component.bgNo).toBeGreaterThanOrEqual(0);
    expect(component.bgNo).toBeLessThan(7);
  });

  it('should expose environment via env getter', () => {
    expect(component.env).toBeDefined();
    expect(component.env.stage).toBeDefined();
  });

  it('should open imprint dialog when called', async () => {
    await component.openImprint();
    const { ImprintPage } = await import('./pages/public/imprint/imprint.page');
    expect(dialogSpy.open).toHaveBeenCalledWith(ImprintPage);
  });

  it('should open data privacy dialog when called', async () => {
    await component.openDataPrivacy();
    const { DataPrivacyPage } = await import('./pages/public/data-privacy/data-privacy.page');
    expect(dialogSpy.open).toHaveBeenCalledWith(DataPrivacyPage);
  });

  it('should render the navbar for anonymous users', () => {
    expect(fixture.nativeElement.querySelector('oc-navbar')).toBeTruthy();
  });

  it('should render the navbar for logged-in users', () => {
    Object.assign(authSpy, { isLoggedIn: true });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('oc-navbar')).toBeTruthy();
  });

  it('should render the footer links on every page', () => {
    const footer = fixture.nativeElement.querySelector('#footer');
    expect(footer).toBeTruthy();
    expect(footer.textContent).toContain('Die Welt');
    expect(footer.textContent).toContain('Die Mächte');
    expect(footer.textContent).toContain('Die Geschichte');
    expect(footer.textContent).toContain('Die Editionen');
    expect(footer.textContent).toContain('Impressum');
    expect(footer.textContent).toContain('Datenschutz');
  });

  it('provides landmarks and a skip link to the focusable main content', () => {
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('header oc-navbar')).toBeTruthy();
    expect(element.querySelector('main#main-content[tabindex="-1"] router-outlet')).toBeTruthy();
    expect(element.querySelector('footer#footer')).toBeTruthy();
    expect(element.querySelector('a.skip-link')?.getAttribute('href')).toBe('#main-content');
    expect(element.querySelector('[tabindex="invalid"]')).toBeNull();
    expect(element.querySelector('#version')?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(element.querySelector('#version h3, #version h4')).toBeNull();
  });

  it('scrolls and moves focus to the start of the main content when the skip link is activated', () => {
    const skip: HTMLAnchorElement = fixture.nativeElement.querySelector('.skip-link');
    const main: HTMLElement = fixture.nativeElement.querySelector('#main-content');
    const scrollSpy = spyOn(main, 'scrollIntoView');
    skip.click();
    expect(scrollSpy).toHaveBeenCalledWith({ block: 'start' });
    expect(document.activeElement).toBe(main);
  });

  it('moves focus to the main content after mobile menu navigation', () => {
    const main: HTMLElement = fixture.nativeElement.querySelector('#main-content');
    const scrollSpy = spyOn(main, 'scrollIntoView');
    fixture.debugElement.query(By.directive(NavbarComponent)).componentInstance.menuNavigation.emit();
    expect(document.activeElement).toBe(main);
    expect(scrollSpy).toHaveBeenCalledWith({ block: 'start' });
  });

  it('opens legal dialogs through semantic footer buttons', async () => {
    const buttons: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll('#footer-links button');
    expect(buttons.length).toBe(2);
    expect(Array.from(buttons).map(button => button.type)).toEqual(['button', 'button']);
    buttons[0].click();
    buttons[1].click();
    await fixture.whenStable();
    expect(dialogSpy.open).toHaveBeenCalledTimes(2);
  });

  for (const [page, buttonIndex, label] of [
    ['imprint', 0, 'Das Impressum'],
    ['privacy', 1, 'Die Datenschutzerklärung']
  ] as const) {
    it(`shows an accessible error and retries the ${page} dialog after a download failure`, async () => {
      const { ImprintPage } = await import('./pages/public/imprint/imprint.page');
      loaders[page].and.returnValues(
        Promise.reject(new Error('chunk unavailable')),
        Promise.resolve(ImprintPage)
      );
      environment.stage = 'production';
      const warning = spyOn(console, 'warn');
      const button: HTMLButtonElement =
        fixture.nativeElement.querySelectorAll('#footer-links button')[buttonIndex];

      button.click();
      await fixture.whenStable();
      fixture.detectChanges();

      const message: HTMLElement = button.parentElement!.querySelector('[role="status"]')!;
      expect(message.textContent).toContain(`${label} konnte nicht geladen werden`);
      expect(message.textContent).toContain('versuche');
      expect(dialogSpy.open).not.toHaveBeenCalled();
      expect(warning).not.toHaveBeenCalled();

      button.click();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(dialogSpy.open).toHaveBeenCalledWith(ImprintPage);
      expect(message.textContent?.trim()).toBe('');
    });
  }

  it('logs a sanitized warning outside production and prevents duplicate pending opens', async () => {
    environment.stage = 'development';
    const warning = spyOn(console, 'warn');
    let rejectLoad!: (reason: Error) => void;
    loaders.imprint.and.returnValue(new Promise((_, reject) => (rejectLoad = reject)));

    const first = component.openImprint();
    await component.openImprint();
    expect(loaders.imprint).toHaveBeenCalledTimes(1);
    expect(component.legalLoading.imprint).toBeTrue();

    rejectLoad(new Error('https://example.com/chunk.js?token=secret'));
    await first;
    expect(warning).toHaveBeenCalledOnceWith('Failed to open imprint dialog, showing a retry message');
    expect(component.legalLoading.imprint).toBeFalse();
    expect(component.legalLoadErrors.imprint).toBeTrue();
  });
});
