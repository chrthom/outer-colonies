import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContentBoxComponent } from './content-box.component';

@Component({
  template: `
    <div class="host-wrapper" [style.width.px]="width">
      <oc-content-box [title]="title">
        <p class="projected-body">Inhalt der Kolonie</p>
      </oc-content-box>
    </div>
  `,
  imports: [ContentBoxComponent]
})
class TestHostComponent {
  width = 320;
  title = 'Edition 3 – Marsianische Hegemonie';
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

  it('should keep .content-box within the host width without horizontal overflow', () => {
    const hostEl: HTMLElement = fixture.nativeElement.querySelector('oc-content-box');
    const boxEl: HTMLElement = fixture.nativeElement.querySelector('.content-box');

    expect(Math.round(boxEl.getBoundingClientRect().width)).toBeLessThanOrEqual(
      Math.round(hostEl.getBoundingClientRect().width)
    );
  });

  it('should push projected content below a multi-line wrapping title', () => {
    const titleH2: HTMLElement = fixture.nativeElement.querySelector('.content-box-title h2');
    const bodyEl: HTMLElement = fixture.nativeElement.querySelector('.projected-body');

    expect(bodyEl.getBoundingClientRect().top).toBeGreaterThanOrEqual(titleH2.getBoundingClientRect().bottom);
  });
});
