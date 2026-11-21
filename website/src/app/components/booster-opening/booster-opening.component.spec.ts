import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { CardImageService } from 'src/app/card-image.service';
import {
  BOOSTER_CLIMAX_EXTRACT_MS,
  BOOSTER_CLIMAX_FLIP_MS,
  BOOSTER_EXTRACT_MS,
  BOOSTER_FLIP_MS,
  BOOSTER_REDUCED_STEP_MS,
  BOOSTER_UNSEAL_MS,
  BoosterOpeningComponent
} from './booster-opening.component';

describe('BoosterOpeningComponent', () => {
  let component: BoosterOpeningComponent;
  let fixture: ComponentFixture<BoosterOpeningComponent>;
  let cardImageSpy: jasmine.SpyObj<CardImageService>;
  let dialogMock: { openDialogs: unknown[] };

  const tenCards = [101, 102, 103, 104, 105, 106, 107, 108, 109, 110];

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

  function createPointerEvent(type: string, clientX: number, clientY: number): PointerEvent {
    return new PointerEvent(type, {
      pointerId: 1,
      pointerType: 'mouse',
      button: 0,
      clientX,
      clientY,
      bubbles: true,
      cancelable: true
    });
  }

  beforeEach(async () => {
    cardImageSpy = jasmine.createSpyObj('CardImageService', ['cardIdToUrl', 'openImgInModal']);
    cardImageSpy.cardIdToUrl.and.callFake((id: number) => `https://assets.example/cards/${id}.png`);
    dialogMock = { openDialogs: [] };

    await TestBed.configureTestingModule({
      imports: [BoosterOpeningComponent],
      providers: [
        { provide: CardImageService, useValue: cardImageSpy },
        { provide: MatDialog, useValue: dialogMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BoosterOpeningComponent);
    component = fixture.componentInstance;
    component.boosterNo = 2;
    component.cards = [...tenCards];
  });

  it('renders the sealed booster pack on init with edition title and card count', () => {
    setReducedMotion(false);
    fixture.detectChanges();

    expect(component.phase).toBe('sealed');
    expect(component.editionName).toBe('Jovians Freihändler');
    expect(component.remainingInPack).toBe(10);
    expect(fixture.nativeElement.querySelector('.booster-title')?.textContent).toContain(
      'Jovians Freihändler'
    );
    expect(fixture.nativeElement.querySelector('.pack-tear-seam')).toBeTruthy();
  });

  it('unseals the pack and draws cards one by one with tension before flipping face-up', fakeAsync(() => {
    setReducedMotion(false);
    fixture.detectChanges();

    // Beat 1: tear open the seal
    component.unsealPack();
    expect(component.phase).toBe('unsealing');
    tick(BOOSTER_UNSEAL_MS);
    fixture.detectChanges();
    expect(component.phase).toBe('ready');
    expect(component.revealedCount).toBe(0);

    // Beat 2: draw card 1 -> extracting (face-down) -> flipping -> revealed
    component.handlePrimaryAction();
    expect(component.phase).toBe('extracting');
    expect(component.isSpotlightFlipped).toBeFalse();
    expect(component.revealedCount).toBe(0);

    tick(BOOSTER_EXTRACT_MS);
    expect(component.phase).toBe('flipping');
    expect(component.isSpotlightFlipped).toBeTrue();
    expect(component.revealedCount).toBe(0);

    tick(BOOSTER_FLIP_MS);
    fixture.detectChanges();
    expect(component.phase).toBe('revealed');
    expect(component.revealedCount).toBe(1);
    expect(component.spotlightCardId).toBe(101);
  }));

  it('escalates tension to climax Alert Red on the final rare card of a 10-card booster', fakeAsync(() => {
    setReducedMotion(false);
    fixture.detectChanges();

    component.unsealPack();
    tick(BOOSTER_UNSEAL_MS);

    // Draw cards 1..9
    for (let i = 0; i < 9; i++) {
      component.handlePrimaryAction();
      tick(BOOSTER_EXTRACT_MS + BOOSTER_FLIP_MS);
    }

    expect(component.revealedCount).toBe(9);
    expect(component.isNextCardClimax).toBeTrue();
    expect(component.slotTier(0)).toBe('standard');
    expect(component.slotTier(6)).toBe('elevated');
    expect(component.slotTier(9)).toBe('climax');
    expect(component.primaryActionLabel).toBe('Abschlusskarte ziehen');

    // Draw final card (uses extended climax extract & flip timings)
    component.handlePrimaryAction();
    expect(component.phase).toBe('extracting');
    expect(component.isClimaxActive).toBeTrue();

    tick(BOOSTER_CLIMAX_EXTRACT_MS);
    expect(component.phase).toBe('flipping');
    tick(BOOSTER_CLIMAX_FLIP_MS);
    fixture.detectChanges();

    expect(component.phase).toBe('revealed');
    expect(component.revealedCount).toBe(10);
    expect(component.spotlightCardId).toBe(110);
    expect(component.isPackEmpty).toBeTrue();
    expect(component.primaryActionLabel).toBe('Alle Karten ansehen');
  }));

  it('completes an active draw immediately when clicked mid-animation', fakeAsync(() => {
    setReducedMotion(false);
    fixture.detectChanges();
    component.unsealPack();
    tick(BOOSTER_UNSEAL_MS);

    component.handlePrimaryAction();
    expect(component.phase).toBe('extracting');

    // Click mid-extraction -> immediately reveals card 1 without losing it
    component.handlePrimaryAction();
    expect(component.phase).toBe('revealed');
    expect(component.revealedCount).toBe(1);
    expect(component.spotlightCardId).toBe(101);
  }));

  it('supports pointer drag to tear the sealed pack and resets insufficient drags', fakeAsync(() => {
    setReducedMotion(false);
    fixture.detectChanges();

    // Small drag that does not reach commit threshold springs back
    component.onSealPointerDown(createPointerEvent('pointerdown', 100, 100));
    component.onSealPointerMove(createPointerEvent('pointermove', 120, 100));
    expect(component.tearProgress).toBeGreaterThan(0);
    expect(component.tearProgress).toBeLessThan(0.42);
    component.onSealPointerUp(createPointerEvent('pointerup', 120, 100));
    expect(component.phase).toBe('sealed');
    expect(component.tearProgress).toBe(0);

    // Sufficient tear drag commits unsealing
    component.onSealPointerDown(createPointerEvent('pointerdown', 100, 100));
    component.onSealPointerMove(createPointerEvent('pointermove', 190, 100));
    component.onSealPointerUp(createPointerEvent('pointerup', 190, 100));
    expect(component.phase).toBe('unsealing');
    tick(BOOSTER_UNSEAL_MS);
    expect(component.phase).toBe('ready');
  }));

  it('supports upward pointer drag to pull a card out of the booster sleeve', fakeAsync(() => {
    setReducedMotion(false);
    fixture.detectChanges();
    component.unsealPack();
    tick(BOOSTER_UNSEAL_MS);

    // Small upward pull resets cleanly
    component.onPullPointerDown(createPointerEvent('pointerdown', 100, 200));
    component.onPullPointerMove(createPointerEvent('pointermove', 100, 185));
    expect(component.pullProgress).toBeGreaterThan(0);
    component.onPullPointerUp(createPointerEvent('pointerup', 100, 185));
    expect(component.phase).toBe('ready');
    expect(component.pullProgress).toBe(0);

    // Sufficient upward pull extracts the card
    component.onPullPointerDown(createPointerEvent('pointerdown', 100, 200));
    component.onPullPointerMove(createPointerEvent('pointermove', 100, 130));
    component.onPullPointerUp(createPointerEvent('pointerup', 100, 130));
    expect(component.phase).toBe('extracting');
    tick(BOOSTER_EXTRACT_MS + BOOSTER_FLIP_MS);
    expect(component.phase).toBe('revealed');
    expect(component.revealedCount).toBe(1);
  }));

  it('disables the close button until all cards have been drawn', fakeAsync(() => {
    setReducedMotion(false);
    fixture.detectChanges();

    const closeBtn = fixture.nativeElement.querySelector('.console-button--close') as HTMLButtonElement;
    expect(closeBtn).toBeTruthy();
    expect(closeBtn.disabled).toBeTrue();
    expect(component.canClose).toBeFalse();

    const doneSpy = jasmine.createSpy('done');
    component.done.subscribe(doneSpy);
    closeBtn.click();
    expect(doneSpy).not.toHaveBeenCalled();

    component.unsealPack();
    tick(BOOSTER_UNSEAL_MS);
    fixture.detectChanges();
    expect(closeBtn.disabled).toBeTrue();

    for (let i = 0; i < 9; i++) {
      component.handlePrimaryAction();
      tick(BOOSTER_EXTRACT_MS + BOOSTER_FLIP_MS);
    }
    fixture.detectChanges();
    expect(closeBtn.disabled).toBeTrue();

    // Draw the 10th (final) card
    component.handlePrimaryAction();
    tick(BOOSTER_CLIMAX_EXTRACT_MS + BOOSTER_CLIMAX_FLIP_MS);
    fixture.detectChanges();

    expect(component.canClose).toBeTrue();
    expect(closeBtn.disabled).toBeFalse();

    closeBtn.click();
    expect(doneSpy).toHaveBeenCalledTimes(1);
  }));

  it('enables the close button immediately after revealing all cards at once', () => {
    setReducedMotion(false);
    fixture.detectChanges();

    const closeBtn = fixture.nativeElement.querySelector('.console-button--close') as HTMLButtonElement;
    expect(closeBtn.disabled).toBeTrue();

    component.revealAll();
    fixture.detectChanges();

    expect(component.canClose).toBeTrue();
    expect(closeBtn.disabled).toBeFalse();
  });

  it('renders the spotlight outer frame outside the rotating card-3d element', fakeAsync(() => {
    setReducedMotion(false);
    fixture.detectChanges();
    component.unsealPack();
    tick(BOOSTER_UNSEAL_MS);
    component.handlePrimaryAction();
    tick(BOOSTER_EXTRACT_MS + BOOSTER_FLIP_MS);
    fixture.detectChanges();

    const frame = fixture.nativeElement.querySelector('.spotlight-card-frame') as HTMLElement;
    const card3d = frame?.querySelector('.card-3d') as HTMLElement;
    expect(frame).toBeTruthy();
    expect(card3d).toBeTruthy();
    expect(card3d.classList.contains('is-flipped')).toBeTrue();
    expect(card3d.closest('.spotlight-card-frame')).toBe(frame);
  }));

  it('allows revealing all cards at once into the summary spread', () => {
    setReducedMotion(false);
    fixture.detectChanges();

    component.revealAll();
    fixture.detectChanges();

    expect(component.phase).toBe('summary');
    expect(component.revealedCount).toBe(10);
    const summaryCards = fixture.nativeElement.querySelectorAll('.summary-card');
    expect(summaryCards.length).toBe(10);
  });

  it('opens the card image modal when inspecting a revealed card', fakeAsync(() => {
    setReducedMotion(false);
    fixture.detectChanges();
    component.unsealPack();
    tick(BOOSTER_UNSEAL_MS);
    component.handlePrimaryAction();
    tick(BOOSTER_EXTRACT_MS + BOOSTER_FLIP_MS);

    component.inspectDrawnCard(0);
    expect(cardImageSpy.openImgInModal).toHaveBeenCalledWith(101, {
      title: 'Karte #101 – Jovians Freihändler (Karte 1/10)',
      alt: 'Karte #101 aus Jovians Freihändler'
    });
  }));

  it('closes on Escape only after all cards are revealed and no card inspection dialog is open', () => {
    setReducedMotion(false);
    fixture.detectChanges();
    const doneSpy = jasmine.createSpy('done');
    component.done.subscribe(doneSpy);

    // Escape and close() are blocked while cards are still unrevealed
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    component.close();
    expect(doneSpy).not.toHaveBeenCalled();

    component.revealAll();
    fixture.detectChanges();

    dialogMock.openDialogs = [{}];
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(doneSpy).not.toHaveBeenCalled();

    dialogMock.openDialogs = [];
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(doneSpy).toHaveBeenCalledTimes(1);
  });

  it('activates seal seam and top card via click/keyboard, suppresses aborted-drag clicks, and preserves focus', fakeAsync(() => {
    setReducedMotion(false);
    fixture.detectChanges();
    tick();

    const seamBtn = fixture.nativeElement.querySelector('.pack-tear-seam') as HTMLButtonElement;
    expect(seamBtn).toBeTruthy();

    // Aborted pointer drag followed by browser pointer click (detail=1) does not unseal
    component.onSealPointerDown(createPointerEvent('pointerdown', 100, 100));
    component.onSealPointerMove(createPointerEvent('pointermove', 120, 100));
    component.onSealPointerUp(createPointerEvent('pointerup', 120, 100));
    seamBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    expect(component.phase).toBe('sealed');

    // Keyboard / assistive click (detail=0) unseals and moves focus off the detached seam button
    seamBtn.focus();
    seamBtn.click();
    fixture.detectChanges();
    tick();
    expect(component.phase).toBe('unsealing');
    const primaryBtn = fixture.nativeElement.querySelector('.console-button--primary') as HTMLButtonElement;
    expect(document.activeElement).toBe(primaryBtn);

    tick(BOOSTER_UNSEAL_MS);
    fixture.detectChanges();
    expect(component.phase).toBe('ready');

    // Draw cards 1..9 quickly, then activate the 10th card via .pack-top-card click while focused
    for (let i = 0; i < 9; i++) {
      component.handlePrimaryAction();
      tick(BOOSTER_EXTRACT_MS + BOOSTER_FLIP_MS);
    }
    fixture.detectChanges();

    const topCardBtn = fixture.nativeElement.querySelector('.pack-top-card') as HTMLButtonElement;
    expect(topCardBtn).toBeTruthy();
    topCardBtn.focus();
    topCardBtn.click();
    fixture.detectChanges();
    tick();
    expect(component.phase).toBe('extracting');
    expect(document.activeElement).toBe(primaryBtn);

    tick(BOOSTER_CLIMAX_EXTRACT_MS + BOOSTER_CLIMAX_FLIP_MS);
    expect(component.phase).toBe('revealed');
    expect(component.revealedCount).toBe(10);
  }));

  it('ignores global keyboard shortcuts when modifier keys are held and avoids block tags inside buttons', () => {
    setReducedMotion(false);
    fixture.detectChanges();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', altKey: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', ctrlKey: true }));
    expect(component.phase).toBe('sealed');

    component.revealAll();
    fixture.detectChanges();
    const buttons = Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button'));
    expect(buttons.length).toBeGreaterThan(0);
    for (const btn of buttons) {
      expect(btn.querySelector('div, h1, h2, h3, h4, h5, h6')).toBeNull();
    }
  });

  it('reveals immediately without spatial travel when prefers-reduced-motion is active', fakeAsync(() => {
    setReducedMotion(true);
    fixture.detectChanges();
    expect(component.reducedMotion).toBeTrue();

    component.unsealPack();
    tick(BOOSTER_REDUCED_STEP_MS);
    expect(component.phase).toBe('ready');

    component.handlePrimaryAction();
    expect(component.phase).toBe('revealed');
    expect(component.revealedCount).toBe(1);
  }));

  it('resets sequence when input cards change and renders fallbacks on image errors', () => {
    setReducedMotion(false);
    fixture.detectChanges();
    component.revealAll();
    expect(component.phase).toBe('summary');

    component.onCardImageError(101);
    expect(component.hasCardImageError(101)).toBeTrue();

    component.cards = [201, 202];
    component.boosterNo = 3;
    component.ngOnChanges({
      cards: new SimpleChange(tenCards, [201, 202], false),
      boosterNo: new SimpleChange(2, 3, false)
    });
    expect(component.phase).toBe('sealed');
    expect(component.hasCardImageError(101)).toBeFalse();
    expect(component.editionName).toBe('Marsianische Hegemonie');
  });
});
