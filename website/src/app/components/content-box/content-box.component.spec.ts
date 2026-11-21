import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContentBoxComponent, ContentBoxVariant } from './content-box.component';

@Component({
  template: `
    <div class="host-wrapper" [style.width.px]="width">
      <oc-content-box [title]="title" [variant]="variant">
        <p class="projected-body">Inhalt der Kolonie</p>
        <button type="button" class="projected-action" (click)="clicked = true">Aktion</button>
      </oc-content-box>
    </div>
  `,
  imports: [ContentBoxComponent]
})
class TestHostComponent {
  width = 320;
  title = 'Edition 3 – Marsianische Hegemonie';
  variant: ContentBoxVariant = 'panel';
  clicked = false;
}

describe('ContentBoxComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should place the h2 title before projected content without empty title attributes', () => {
    const boxEl: HTMLElement = fixture.nativeElement.querySelector('.content-box');
    const titleEl = boxEl.querySelector('.content-box-title');
    const centerEl = boxEl.querySelector('.content-box-center');

    expect(titleEl?.querySelector('h2')?.textContent).toBe('Edition 3 – Marsianische Hegemonie');
    expect(boxEl.querySelectorAll('[title]').length).toBe(0);
    expect(
      titleEl &&
        centerEl &&
        (titleEl.compareDocumentPosition(centerEl) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
    ).toBe(true);
  });

  it('should omit the heading wrapper when no title is provided', () => {
    fixture.componentInstance.title = '';
    fixture.detectChanges();

    const boxEl: HTMLElement = fixture.nativeElement.querySelector('.content-box');
    expect(boxEl.querySelector('.content-box-title')).toBeNull();
    expect(boxEl.querySelector('h2')).toBeNull();
  });

  it('should render a single aria-hidden decorative frame layer without raster slice elements', () => {
    const boxEl: HTMLElement = fixture.nativeElement.querySelector('.content-box');
    const frames = boxEl.querySelectorAll('.content-box-frame');

    expect(frames.length).toBe(1);
    expect(frames[0].getAttribute('aria-hidden')).toBe('true');
    expect(getComputedStyle(frames[0]).pointerEvents).toBe('none');
    expect(boxEl.querySelector('.content-box-top-left')).toBeNull();
    expect(boxEl.querySelector('.content-box-top-right')).toBeNull();
  });

  it('should keep .content-box within the host width without horizontal overflow', () => {
    const hostEl: HTMLElement = fixture.nativeElement.querySelector('oc-content-box');
    const boxEl: HTMLElement = fixture.nativeElement.querySelector('.content-box');

    expect(Math.round(boxEl.getBoundingClientRect().width)).toBeLessThanOrEqual(
      Math.round(hostEl.getBoundingClientRect().width)
    );
  });

  it('should push projected content below a multi-line wrapping title on narrow containers', () => {
    for (const width of [320, 195]) {
      fixture.componentInstance.width = width;
      fixture.detectChanges();

      const hostRect = (
        fixture.nativeElement.querySelector('oc-content-box') as HTMLElement
      ).getBoundingClientRect();
      const boxRect = (
        fixture.nativeElement.querySelector('.content-box') as HTMLElement
      ).getBoundingClientRect();
      const titleH2 = fixture.nativeElement.querySelector('.content-box-title h2') as HTMLElement;
      const bodyEl = fixture.nativeElement.querySelector('.projected-body') as HTMLElement;

      expect(Math.round(boxRect.width)).toBeLessThanOrEqual(Math.round(hostRect.width));
      expect(Math.round(titleH2.getBoundingClientRect().right)).toBeLessThanOrEqual(
        Math.round(boxRect.right)
      );
      expect(bodyEl.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        titleH2.getBoundingClientRect().bottom
      );
    }
  });

  it('should switch surface treatment via variant input', () => {
    const boxEl: HTMLElement = fixture.nativeElement.querySelector('.content-box');
    const frameEl: HTMLElement = fixture.nativeElement.querySelector('.content-box-frame');

    expect(boxEl.getAttribute('data-variant')).toBe('panel');
    expect(getComputedStyle(frameEl).display).not.toBe('none');

    fixture.componentInstance.variant = 'brackets';
    fixture.detectChanges();
    expect(boxEl.getAttribute('data-variant')).toBe('brackets');
    expect(getComputedStyle(frameEl).display).not.toBe('none');

    fixture.componentInstance.variant = 'open';
    fixture.detectChanges();
    expect(boxEl.getAttribute('data-variant')).toBe('open');
    expect(getComputedStyle(frameEl).display).toBe('none');
  });

  it('should preserve focus and click interaction for projected controls', () => {
    const actionBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.projected-action');

    actionBtn.focus();
    expect(document.activeElement).toBe(actionBtn);

    actionBtn.click();
    expect(fixture.componentInstance.clicked).toBeTrue();
  });
});
