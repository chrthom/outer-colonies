import { Component } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { firstValueFrom } from 'rxjs';
import { DataPrivacyPage } from './data-privacy.page';

@Component({ template: 'Startseite' })
class HomeStubComponent {}

function expectSequentialHeadings(element: Element): void {
  const headings = Array.from(element.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  expect(headings[0]?.tagName).toBe('H1');
  let previous = 1;
  for (const heading of headings.slice(1)) {
    const level = Number(heading.tagName.slice(1));
    expect(level).toBeLessThanOrEqual(previous + 1);
    previous = level;
  }
  expect(headings.some(heading => heading.tagName === 'H4')).toBeTrue();
}

function expectReadableProse(element: Element): void {
  for (const prose of Array.from(element.querySelectorAll('p, li'))) {
    const style = getComputedStyle(prose);
    const measure = document.createElement('span');
    measure.style.width = '66ch';
    measure.style.display = 'block';
    prose.appendChild(measure);
    expect(style.maxWidth).toBe(getComputedStyle(measure).width);
    expect(style.textWrap).toContain('pretty');
    expect(parseFloat(style.lineHeight)).toBeGreaterThan(parseFloat(style.fontSize));
    measure.remove();
  }
}

describe('DataPrivacyPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataPrivacyPage],
      providers: [
        provideRouter([
          { path: 'privacy', component: DataPrivacyPage },
          { path: '', component: HomeStubComponent }
        ]),
        provideNoopAnimations()
      ]
    }).compileComponents();
  });

  it('renders a readable framed route with a working home link', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/privacy', DataPrivacyPage);
    const page = harness.routeNativeElement!;

    expect(page.querySelector('oc-content-box')).toBeTruthy();
    expect(page.querySelector('mat-dialog-content, mat-dialog-actions, [mat-dialog-close]')).toBeNull();
    expectSequentialHeadings(page);
    expectReadableProse(page);
    const link = page.querySelector('a[href="/"]') as HTMLAnchorElement;
    expect(link.textContent?.trim()).toBe('Zur Startseite');
    link.click();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/');
    expect(harness.routeNativeElement?.textContent).toContain('Startseite');
  });

  it('renders readable content in a real dialog and closes using the close button', async () => {
    const ref = TestBed.inject(MatDialog).open(DataPrivacyPage);
    ref.componentRef!.changeDetectorRef.detectChanges();
    const closed = firstValueFrom(ref.afterClosed());
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    const content = overlay.querySelector('mat-dialog-content')!;

    expect(content.textContent).toContain('Datenschutz auf einen Blick');
    expectSequentialHeadings(content);
    expectReadableProse(content);
    expect(overlay.querySelector('oc-content-box, a[href="/"]')).toBeNull();
    const button = overlay.querySelector('mat-dialog-actions button') as HTMLButtonElement;
    expect(button.textContent?.trim()).toBe('Schließen');
    button.click();
    await closed;
    expect(overlay.querySelector('mat-dialog-content')).toBeNull();
  });
});
