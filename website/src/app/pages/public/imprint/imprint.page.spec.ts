import { Component } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { firstValueFrom } from 'rxjs';
import { ImprintPage } from './imprint.page';

@Component({ template: 'Startseite' })
class HomeStubComponent {}

describe('ImprintPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImprintPage],
      providers: [
        provideRouter([
          { path: 'imprint', component: ImprintPage },
          { path: '', component: HomeStubComponent }
        ]),
        provideNoopAnimations()
      ]
    }).compileComponents();
  });

  it('renders a framed route with sequential headings and a working home link', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/imprint', ImprintPage);
    const page = harness.routeNativeElement!;

    expect(page.querySelector('oc-content-box')).toBeTruthy();
    expect(page.querySelector('mat-dialog-content, mat-dialog-actions, [mat-dialog-close]')).toBeNull();
    expect(Array.from(page.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => h.tagName)).toEqual([
      'H1',
      'H2',
      'H2',
      'H2'
    ]);
    const link = page.querySelector('a[href="/"]') as HTMLAnchorElement;
    expect(link.textContent?.trim()).toBe('Zur Startseite');
    link.click();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/');
    expect(harness.routeNativeElement?.textContent).toContain('Startseite');
  });

  it('renders in a real dialog and closes using the close button', async () => {
    const ref = TestBed.inject(MatDialog).open(ImprintPage);
    ref.componentRef!.changeDetectorRef.detectChanges();
    const closed = firstValueFrom(ref.afterClosed());
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    const content = overlay.querySelector('mat-dialog-content')!;

    expect(content.textContent).toContain('Angaben gemäß § 5 TMG');
    expect(Array.from(content.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => h.tagName)).toEqual([
      'H1',
      'H2',
      'H2'
    ]);
    expect(overlay.querySelector('oc-content-box, a[href="/"]')).toBeNull();
    const button = overlay.querySelector('mat-dialog-actions button') as HTMLButtonElement;
    expect(button.textContent?.trim()).toBe('Schließen');
    button.click();
    await closed;
    expect(overlay.querySelector('mat-dialog-content')).toBeNull();
  });
});
