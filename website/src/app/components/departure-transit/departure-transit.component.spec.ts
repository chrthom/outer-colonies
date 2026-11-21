import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  DEPARTURE_DURATION_MS,
  DEPARTURE_REDUCED_MOTION_MS,
  DepartureTransitComponent
} from './departure-transit.component';

describe('DepartureTransitComponent', () => {
  let component: DepartureTransitComponent;
  let fixture: ComponentFixture<DepartureTransitComponent>;

  function setReducedMotion(matches: boolean): jasmine.Spy {
    return spyOn(window, 'matchMedia').and.returnValue({
      matches,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    } as MediaQueryList);
  }

  function activate(): void {
    component.active = true;
    component.ngOnChanges({ active: new SimpleChange(false, true, false) });
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DepartureTransitComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DepartureTransitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('does not render the overlay when inactive', () => {
    expect(fixture.nativeElement.querySelector('.departure-overlay')).toBeNull();
  });

  it('renders the full-viewport flight-console dialog when activated', fakeAsync(() => {
    setReducedMotion(false);
    const rafSpy = spyOn(window, 'requestAnimationFrame').and.returnValue(1);
    const cancelSpy = spyOn(window, 'cancelAnimationFrame');

    activate();
    tick(); // flush microtask for canvas/focus setup

    const overlay: HTMLElement | null = fixture.nativeElement.querySelector('.departure-overlay');
    expect(overlay).toBeTruthy();
    expect(overlay?.getAttribute('role')).toBe('dialog');
    expect(overlay?.getAttribute('aria-modal')).toBe('true');
    expect(fixture.nativeElement.querySelector('.departure-canvas')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.departure-trajectory')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
    expect(fixture.nativeElement.querySelector('.departure-console h2')?.textContent).toContain(
      'Kursberechnung'
    );
    expect(rafSpy).toHaveBeenCalled();

    fixture.destroy();
    expect(cancelSpy).toHaveBeenCalledWith(1);
  }));

  it('advances through phases and emits complete after the burn duration', fakeAsync(() => {
    setReducedMotion(false);
    let nextFrame: FrameRequestCallback | undefined;
    spyOn(window, 'requestAnimationFrame').and.callFake((cb: FrameRequestCallback) => {
      nextFrame = cb;
      return 1;
    });

    const completeSpy = jasmine.createSpy('complete');
    component.complete.subscribe(completeSpy);

    activate();
    tick();

    expect(nextFrame).toBeDefined();
    nextFrame!(1000);
    expect(component.phaseTitle).toBe('Kursberechnung');

    nextFrame!(1000 + DEPARTURE_DURATION_MS * 0.5);
    expect(component.phaseTitle).toBe('Transferbahn aktiv');
    expect(component.progress).toBeCloseTo(0.5, 2);

    nextFrame!(1000 + DEPARTURE_DURATION_MS * 0.85);
    expect(component.phaseTitle).toBe('Übergang zum Client');
    expect(component.voidCurtainOpacity).toBeGreaterThan(0);

    nextFrame!(1000 + DEPARTURE_DURATION_MS);
    expect(completeSpy).toHaveBeenCalledTimes(1);
  }));

  it('skips canvas animation and holds briefly before completing under reduced motion', fakeAsync(() => {
    setReducedMotion(true);
    const rafSpy = spyOn(window, 'requestAnimationFrame');
    const completeSpy = jasmine.createSpy('complete');
    component.complete.subscribe(completeSpy);

    activate();
    tick();

    expect(component.reducedMotion).toBeTrue();
    expect(component.transferArcOffset).toBe(0);
    expect(component.voidCurtainOpacity).toBe(0);
    expect(rafSpy).not.toHaveBeenCalled();
    expect(completeSpy).not.toHaveBeenCalled();

    tick(DEPARTURE_REDUCED_MOTION_MS);
    expect(completeSpy).toHaveBeenCalledTimes(1);
  }));

  it('emits cancelled on Escape without emitting complete', fakeAsync(() => {
    setReducedMotion(false);
    spyOn(window, 'requestAnimationFrame').and.returnValue(1);
    const completeSpy = jasmine.createSpy('complete');
    const cancelSpy = jasmine.createSpy('cancelled');
    component.complete.subscribe(completeSpy);
    component.cancelled.subscribe(cancelSpy);

    activate();
    tick();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(cancelSpy).toHaveBeenCalledTimes(1);
    expect(completeSpy).not.toHaveBeenCalled();
  }));

  it('focuses the dialog overlay and keeps Tab from escaping while active', fakeAsync(() => {
    setReducedMotion(true);
    activate();
    tick();

    const overlay: HTMLElement = fixture.nativeElement.querySelector('.departure-overlay');
    expect(document.activeElement).toBe(overlay);

    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
    document.dispatchEvent(tabEvent);
    expect(tabEvent.defaultPrevented).toBeTrue();
    expect(document.activeElement).toBe(overlay);

    tick(DEPARTURE_REDUCED_MOTION_MS);
  }));

  it('normalizes transfer-arc pathLength to 240 to stay synchronized with vesselPoint', fakeAsync(() => {
    setReducedMotion(false);
    spyOn(window, 'requestAnimationFrame').and.returnValue(1);
    activate();
    tick();

    const arc: SVGPathElement | null = fixture.nativeElement.querySelector('.transfer-arc');
    expect(arc?.getAttribute('pathLength')).toBe('240');

    fixture.destroy();
  }));

  it('does not start the animation or listeners if destroyed before the setup microtask runs', fakeAsync(() => {
    setReducedMotion(false);
    const rafSpy = spyOn(window, 'requestAnimationFrame');
    const addListenerSpy = spyOn(window, 'addEventListener').and.callThrough();

    activate();
    fixture.destroy();
    tick();

    expect(rafSpy).not.toHaveBeenCalled();
    expect(addListenerSpy).not.toHaveBeenCalledWith('resize', jasmine.any(Function), jasmine.anything());
  }));
});
