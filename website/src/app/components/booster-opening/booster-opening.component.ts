import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  PLATFORM_ID,
  SimpleChanges,
  ViewChild,
  inject
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { constants } from '@shared/config/constants';
import { editions } from '@shared/config/editions';
import { CardImageService } from 'src/app/card-image.service';
import { environment } from 'src/environments/environment';

/** Sequential phases of the physical booster pack opening ritual. */
export type BoosterOpeningPhase =
  | 'sealed'
  | 'unsealing'
  | 'ready'
  | 'extracting'
  | 'flipping'
  | 'revealed'
  | 'summary';

/** Tension tier derived from booster slot position. */
export type BoosterSlotTier = 'standard' | 'elevated' | 'climax';

/** Duration of the pack-unsealing tear animation in normal motion (ms). */
export const BOOSTER_UNSEAL_MS = 420;
/** Duration of sliding the face-down card out of the booster pouch (ms). */
export const BOOSTER_EXTRACT_MS = 240;
/** Extended anticipation slide duration for the final rare slot (ms). */
export const BOOSTER_CLIMAX_EXTRACT_MS = 340;
/** Duration of the 3D card flip reveal in normal motion (ms). */
export const BOOSTER_FLIP_MS = 360;
/** Extended flip reveal duration for the final rare slot (ms). */
export const BOOSTER_CLIMAX_FLIP_MS = 480;
/** Compressed transition cadence when `prefers-reduced-motion` is active (ms). */
export const BOOSTER_REDUCED_STEP_MS = 80;

const TEAR_DRAG_DISTANCE_PX = 110;
const TEAR_COMMIT_THRESHOLD = 0.42;
const PULL_DRAG_DISTANCE_PX = 100;
const PULL_COMMIT_THRESHOLD = 0.38;
const DRAG_DEADZONE_PX = 6;

/**
 * Full-viewport Flight Console booster unboxing stage.
 * Lets the player tear open the sealed booster sleeve, physically draw each
 * face-down card out one by one with escalating Signal-Teal-to-Alert-Red tension,
 * and inspect the revealed spread at full resolution.
 */
@Component({
  selector: 'oc-booster-opening',
  templateUrl: './booster-opening.component.html',
  styleUrls: ['./booster-opening.component.scss']
})
export class BoosterOpeningComponent implements OnInit, OnChanges, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly cardImage = inject(CardImageService);
  private readonly dialog = inject(MatDialog);

  /** Edition number of the opened booster pack (1–5). */
  @Input() boosterNo = 1;

  /** Ordered card IDs returned by the backend when opening the booster. */
  @Input() cards: number[] = [];

  /** Emitted when the player finishes or closes the unboxing overlay. */
  @Output() readonly done = new EventEmitter<void>();

  @ViewChild('primaryActionButton') private primaryActionButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('closeButton') private closeButton?: ElementRef<HTMLButtonElement>;

  readonly assetURL = environment.url.assets;
  readonly cardBackUrl = `${environment.url.assets}/cards/${constants.cardBackSideID}.png`;

  phase: BoosterOpeningPhase = 'sealed';
  currentIndex = 0;
  revealedCount = 0;
  reducedMotion = false;

  tearProgress = 0;
  pullProgress = 0;
  isDraggingTear = false;
  isDraggingPull = false;

  boosterImageError = false;
  cardBackImageError = false;
  private readonly failedCardImages = new Set<number>();

  private activeTimer: ReturnType<typeof setTimeout> | null = null;
  private previouslyFocusedElement: HTMLElement | null = null;
  private preloadedUrls = new Set<string>();

  private activeTearPointerId: number | null = null;
  private tearStartX = 0;
  private tearStartY = 0;
  private tearDidMove = false;

  private activePullPointerId: number | null = null;
  private pullStartY = 0;
  private pullDidMove = false;

  /** Display name of the booster edition. */
  get editionName(): string {
    return editions[this.boosterNo] ?? `Edition ${this.boosterNo}`;
  }

  /** Booster artwork URL for the current edition. */
  get boosterImageUrl(): string {
    return `${this.assetURL}/items/booster${this.boosterNo}.png`;
  }

  /** Total number of cards contained in this booster pack. */
  get totalCards(): number {
    return this.cards.length;
  }

  /** Number of cards still face-down inside the booster sleeve. */
  get remainingInPack(): number {
    if (this.phase === 'sealed' || this.phase === 'unsealing' || this.phase === 'ready') {
      return Math.max(0, this.totalCards - this.currentIndex);
    }
    return Math.max(0, this.totalCards - (this.currentIndex + 1));
  }

  /** Card ID currently featured in the spotlight (extracting, flipping, or revealed). */
  get spotlightCardId(): number | undefined {
    if (this.phase === 'extracting' || this.phase === 'flipping' || this.phase === 'revealed') {
      return this.cards[this.currentIndex];
    }
    return undefined;
  }

  /** Whether the spotlight card has flipped face-up. */
  get isSpotlightFlipped(): boolean {
    return this.phase === 'flipping' || this.phase === 'revealed';
  }

  /** Whether all cards in the pack have been drawn out. */
  get isPackEmpty(): boolean {
    return this.remainingInPack === 0;
  }

  /** Whether all cards in the booster have been drawn so the close button is active. */
  get canClose(): boolean {
    return this.revealedCount >= this.totalCards;
  }

  /** Whether the currently drawn or next-up card is the final climax slot. */
  get isClimaxActive(): boolean {
    if (this.totalCards <= 1) return false;
    if (this.phase === 'sealed' || this.phase === 'unsealing') return false;
    if (this.phase === 'ready') {
      return this.currentIndex === this.totalCards - 1;
    }
    if (this.phase === 'extracting' || this.phase === 'flipping' || this.phase === 'revealed') {
      return this.currentIndex === this.totalCards - 1;
    }
    return false;
  }

  /** Whether only the final card remains waiting inside the sleeve while the previous card is viewed. */
  get isNextCardClimax(): boolean {
    if (this.totalCards <= 1) return false;
    if (this.phase === 'ready') {
      return this.currentIndex === this.totalCards - 1;
    }
    if (this.phase === 'revealed') {
      return this.currentIndex + 1 === this.totalCards - 1;
    }
    return false;
  }

  /** Visual stack depth layers (0–3) representing remaining cards in the sleeve. */
  get stackLayers(): number[] {
    const count = Math.min(3, Math.max(0, this.remainingInPack - 1));
    return Array.from({ length: count }, (_, idx) => idx);
  }

  /** Progress bar fraction (0–1) across the pack opening sequence. */
  get progressFraction(): number {
    if (this.totalCards <= 0) return 0;
    if (this.phase === 'summary') return 1;
    return this.revealedCount / this.totalCards;
  }

  /** Live status line announced visually and to assistive technology. */
  get statusText(): string {
    if (this.totalCards === 0) {
      return 'Keine Karten im Booster-Pack vorhanden.';
    }
    switch (this.phase) {
      case 'sealed':
        return `${this.totalCards} Karten versiegelt. Siegel aufziehen oder aktivieren, um die Packung zu öffnen.`;
      case 'unsealing':
        return 'Siegel wird durchtrennt …';
      case 'ready':
        return this.isClimaxActive
          ? `Letzte Karte (${this.currentIndex + 1} / ${this.totalCards}) liegt im Fach – bereit zur Entnahme.`
          : `Packung geöffnet. Ziehe Karte ${this.currentIndex + 1} von ${this.totalCards} aus der Hülle.`;
      case 'extracting':
        return this.isClimaxActive
          ? `Abschlusskarte ${this.currentIndex + 1} von ${this.totalCards} wird entnommen …`
          : `Karte ${this.currentIndex + 1} von ${this.totalCards} wird gezogen …`;
      case 'flipping':
        return `Karte ${this.currentIndex + 1} von ${this.totalCards} wird aufgedeckt …`;
      case 'revealed': {
        const cardId = this.cards[this.currentIndex];
        if (this.currentIndex < this.totalCards - 1) {
          return this.isNextCardClimax
            ? `Karte #${cardId} gezogen. Noch eine letzte Karte in der Packung.`
            : `Karte #${cardId} gezogen (${this.revealedCount} / ${this.totalCards}).`;
        }
        return `Alle ${this.totalCards} Karten gezogen – Abschlusskarte #${cardId} aufgedeckt.`;
      }
      case 'summary':
        return `Alle ${this.totalCards} Karten aus „${this.editionName}“ in dein Inventar übernommen.`;
    }
  }

  /** Label for the primary action button in the footer control bar. */
  get primaryActionLabel(): string {
    switch (this.phase) {
      case 'sealed':
        return 'Siegel aufreißen';
      case 'unsealing':
        return 'Öffnet …';
      case 'ready':
        return this.isClimaxActive ? 'Abschlusskarte ziehen' : 'Erste Karte ziehen';
      case 'extracting':
      case 'flipping':
        return 'Sofort aufdecken';
      case 'revealed':
        if (this.currentIndex < this.totalCards - 1) {
          return this.isNextCardClimax ? 'Abschlusskarte ziehen' : 'Nächste Karte ziehen';
        }
        return 'Alle Karten ansehen';
      case 'summary':
        return 'Zurück zum Markt';
    }
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.previouslyFocusedElement =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      this.reducedMotion = this.detectReducedMotion();
    }
    this.resetSequence();
    this.preloadAssets();
    this.focusPrimaryActionSoon();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes['cards'] && !changes['cards'].firstChange) ||
      (changes['boosterNo'] && !changes['boosterNo'].firstChange)
    ) {
      this.boosterImageError = false;
      this.failedCardImages.clear();
      this.resetSequence();
      this.preloadAssets();
    }
  }

  ngOnDestroy(): void {
    this.clearActiveTimer();
    if (isPlatformBrowser(this.platformId) && this.previouslyFocusedElement?.isConnected) {
      this.previouslyFocusedElement.focus();
      this.previouslyFocusedElement = null;
    }
  }

  /** Handles keyboard shortcuts while the booster overlay is open. */
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      // Let an open full-resolution card inspection modal handle Escape first.
      if (this.dialog.openDialogs.length > 0) return;
      event.preventDefault();
      this.close();
      return;
    }

    if (this.dialog.openDialogs.length > 0) return;

    const target = event.target as HTMLElement | null;
    const isInteractiveTarget =
      target?.tagName === 'BUTTON' || target?.tagName === 'A' || target?.getAttribute('role') === 'button';

    if (event.key === 'ArrowRight' && this.phase !== 'summary') {
      event.preventDefault();
      this.handlePrimaryAction();
      return;
    }

    if ((event.key === ' ' || event.key === 'Enter') && !isInteractiveTarget) {
      event.preventDefault();
      this.handlePrimaryAction();
    }
  }

  /**
   * Returns the tension tier for a given card slot index.
   * Server `generateBoosterContent` orders boosters as 6 common, 3 uncommon, 1 rare.
   */
  slotTier(index: number): BoosterSlotTier {
    if (this.totalCards === 10) {
      if (index === 9) return 'climax';
      if (index >= 6) return 'elevated';
      return 'standard';
    }
    if (this.totalCards > 1 && index === this.totalCards - 1) {
      return 'climax';
    }
    return 'standard';
  }

  /** Human-readable slot badge text for a slot index. */
  slotTierLabel(index: number): string {
    const tier = this.slotTier(index);
    if (tier === 'climax') {
      return this.totalCards === 10 ? 'Selten+' : 'Abschlusskarte';
    }
    if (tier === 'elevated') {
      return 'Ungewöhnlich';
    }
    return 'Standard';
  }

  /** Zero-padded 2-digit slot number (e.g. `01`). */
  formatSlotNumber(oneBasedIndex: number): string {
    return String(oneBasedIndex).padStart(2, '0');
  }

  /** Triggers the context-appropriate primary action for the current phase. */
  handlePrimaryAction(): void {
    switch (this.phase) {
      case 'sealed':
        this.unsealPack();
        break;
      case 'unsealing':
        this.finishUnsealingImmediately();
        break;
      case 'ready':
        this.beginCardDraw(this.currentIndex);
        break;
      case 'extracting':
      case 'flipping':
        this.completeActiveDraw();
        break;
      case 'revealed':
        if (this.currentIndex < this.totalCards - 1) {
          this.beginCardDraw(this.currentIndex + 1);
        } else {
          this.showSummary();
        }
        break;
      case 'summary':
        this.close();
        break;
    }
  }

  /** Tears open the sealed booster sleeve and exposes the face-down card stack. */
  unsealPack(): void {
    if (this.phase !== 'sealed') return;
    this.clearActiveTimer();
    this.tearProgress = 1;
    this.isDraggingTear = false;
    this.phase = 'unsealing';

    const duration = this.reducedMotion ? BOOSTER_REDUCED_STEP_MS : BOOSTER_UNSEAL_MS;
    this.activeTimer = setTimeout(() => {
      this.activeTimer = null;
      this.finishUnsealingImmediately();
    }, duration);
  }

  /** Reveals all remaining cards immediately and opens the summary spread. */
  revealAll(): void {
    this.clearActiveTimer();
    this.tearProgress = 1;
    this.pullProgress = 0;
    this.isDraggingTear = false;
    this.isDraggingPull = false;
    this.revealedCount = this.totalCards;
    this.currentIndex = Math.max(0, this.totalCards - 1);
    this.phase = 'summary';
    this.focusPrimaryActionSoon();
  }

  /** Transitions to the full card spread summary after all cards have been drawn. */
  showSummary(): void {
    this.clearActiveTimer();
    this.revealedCount = this.totalCards;
    this.phase = 'summary';
    this.focusPrimaryActionSoon();
  }

  /** Selects an already drawn card from the tray to inspect it in the spotlight or full modal. */
  inspectDrawnCard(index: number): void {
    if (index < 0 || index >= this.revealedCount) return;
    const cardId = this.cards[index];
    if (cardId === undefined) return;
    this.openCardModal(cardId, index);
  }

  /** Opens a card at full resolution in the shared image modal. */
  openCardModal(cardId: number, slotIndex?: number): void {
    const slotSuffix = slotIndex !== undefined ? ` (Karte ${slotIndex + 1}/${this.totalCards})` : '';
    this.cardImage.openImgInModal(cardId, {
      title: `Karte #${cardId} – ${this.editionName}${slotSuffix}`,
      alt: `Karte #${cardId} aus ${this.editionName}`
    });
  }

  /** Closes the booster opening overlay and returns to the trade page. */
  close(): void {
    this.clearActiveTimer();
    this.done.emit();
  }

  /** Starts tracking a horizontal/diagonal pointer tear across the sealed pack top. */
  onSealPointerDown(event: PointerEvent): void {
    if (this.phase !== 'sealed') return;
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    this.activeTearPointerId = event.pointerId;
    this.tearStartX = event.clientX;
    this.tearStartY = event.clientY;
    this.tearDidMove = false;
    this.isDraggingTear = true;
    (event.currentTarget as HTMLElement | null)?.setPointerCapture?.(event.pointerId);
  }

  /** Updates the tear progress as the pointer drags across the perforation line. */
  onSealPointerMove(event: PointerEvent): void {
    if (!this.isDraggingTear || event.pointerId !== this.activeTearPointerId || this.phase !== 'sealed') {
      return;
    }
    const distance = Math.hypot(event.clientX - this.tearStartX, event.clientY - this.tearStartY);
    if (distance >= DRAG_DEADZONE_PX) {
      this.tearDidMove = true;
    }
    this.tearProgress = Math.min(1, Math.max(0, distance / TEAR_DRAG_DISTANCE_PX));
  }

  /** Commits the pack tear on tap or sufficient drag, otherwise springs the seal closed. */
  onSealPointerUp(event: PointerEvent): void {
    if (!this.isDraggingTear || event.pointerId !== this.activeTearPointerId) return;
    this.activeTearPointerId = null;
    this.isDraggingTear = false;
    if (this.phase !== 'sealed') return;

    if (!this.tearDidMove || this.tearProgress >= TEAR_COMMIT_THRESHOLD) {
      this.unsealPack();
    } else {
      this.tearProgress = 0;
    }
  }

  /** Resets tear state if the pointer interaction is cancelled by the browser. */
  onSealPointerCancel(event: PointerEvent): void {
    if (event.pointerId !== this.activeTearPointerId) return;
    this.activeTearPointerId = null;
    this.isDraggingTear = false;
    if (this.phase === 'sealed') {
      this.tearProgress = 0;
    }
  }

  /** Starts tracking an upward pull gesture on the next face-down card inside the pouch. */
  onPullPointerDown(event: PointerEvent): void {
    if (this.isPackEmpty) return;
    if (this.phase !== 'ready' && this.phase !== 'revealed') return;
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    this.activePullPointerId = event.pointerId;
    this.pullStartY = event.clientY;
    this.pullDidMove = false;
    this.isDraggingPull = true;
    (event.currentTarget as HTMLElement | null)?.setPointerCapture?.(event.pointerId);
  }

  /** Updates how far the face-down card is physically pulled out of the sleeve. */
  onPullPointerMove(event: PointerEvent): void {
    if (!this.isDraggingPull || event.pointerId !== this.activePullPointerId) return;
    const upwardDelta = this.pullStartY - event.clientY;
    if (Math.abs(upwardDelta) >= DRAG_DEADZONE_PX) {
      this.pullDidMove = true;
    }
    this.pullProgress = Math.min(1, Math.max(0, upwardDelta / PULL_DRAG_DISTANCE_PX));
  }

  /** Draws the card out on tap or sufficient upward pull, otherwise lets it settle back into the sleeve. */
  onPullPointerUp(event: PointerEvent): void {
    if (!this.isDraggingPull || event.pointerId !== this.activePullPointerId) return;
    this.activePullPointerId = null;
    this.isDraggingPull = false;

    const shouldCommit = !this.pullDidMove || this.pullProgress >= PULL_COMMIT_THRESHOLD;
    this.pullProgress = 0;

    if (!shouldCommit || this.isPackEmpty) return;
    if (this.phase === 'ready') {
      this.beginCardDraw(this.currentIndex);
    } else if (this.phase === 'revealed' && this.currentIndex < this.totalCards - 1) {
      this.beginCardDraw(this.currentIndex + 1);
    }
  }

  /** Resets pull-out drag state if cancelled by the browser. */
  onPullPointerCancel(event: PointerEvent): void {
    if (event.pointerId !== this.activePullPointerId) return;
    this.activePullPointerId = null;
    this.isDraggingPull = false;
    this.pullProgress = 0;
  }

  /** Records failed card artwork loads so a Flight Console placeholder renders cleanly. */
  onCardImageError(cardId: number): void {
    this.failedCardImages.add(cardId);
  }

  /** Returns whether a specific card artwork failed to load. */
  hasCardImageError(cardId: number): boolean {
    return this.failedCardImages.has(cardId);
  }

  /** Builds the thumbnail URL for a card ID. */
  cardThumbnailUrl(cardId: number): string {
    return this.cardImage.cardIdToUrl(cardId);
  }

  private resetSequence(): void {
    this.clearActiveTimer();
    this.currentIndex = 0;
    this.revealedCount = 0;
    this.tearProgress = 0;
    this.pullProgress = 0;
    this.isDraggingTear = false;
    this.isDraggingPull = false;
    this.phase = this.cards.length > 0 ? 'sealed' : 'summary';
  }

  private finishUnsealingImmediately(): void {
    this.clearActiveTimer();
    this.tearProgress = 1;
    this.phase = this.totalCards > 0 ? 'ready' : 'summary';
    this.cdr.markForCheck();
  }

  private beginCardDraw(index: number): void {
    if (index < 0 || index >= this.totalCards) return;
    this.clearActiveTimer();
    this.currentIndex = index;
    this.pullProgress = 0;

    if (this.reducedMotion) {
      this.completeActiveDraw();
      return;
    }

    this.phase = 'extracting';
    const isClimax = this.slotTier(index) === 'climax';
    const extractMs = isClimax ? BOOSTER_CLIMAX_EXTRACT_MS : BOOSTER_EXTRACT_MS;
    const flipMs = isClimax ? BOOSTER_CLIMAX_FLIP_MS : BOOSTER_FLIP_MS;

    this.activeTimer = setTimeout(() => {
      this.phase = 'flipping';
      this.cdr.markForCheck();
      this.activeTimer = setTimeout(() => {
        this.activeTimer = null;
        this.completeActiveDraw();
      }, flipMs);
    }, extractMs);
  }

  private completeActiveDraw(): void {
    this.clearActiveTimer();
    if (this.currentIndex < this.totalCards) {
      this.revealedCount = Math.max(this.revealedCount, this.currentIndex + 1);
    }
    this.phase = 'revealed';
    this.cdr.markForCheck();
  }

  private clearActiveTimer(): void {
    if (this.activeTimer !== null) {
      clearTimeout(this.activeTimer);
      this.activeTimer = null;
    }
  }

  private detectReducedMotion(): boolean {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private preloadAssets(): void {
    if (!isPlatformBrowser(this.platformId) || typeof Image === 'undefined') return;
    const urls = [this.boosterImageUrl, this.cardBackUrl, ...this.cards.map(id => this.cardThumbnailUrl(id))];
    for (const url of urls) {
      if (this.preloadedUrls.has(url)) continue;
      this.preloadedUrls.add(url);
      const img = new Image();
      img.src = url;
    }
  }

  private focusPrimaryActionSoon(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    queueMicrotask(() => {
      const target = this.primaryActionButton?.nativeElement ?? this.closeButton?.nativeElement;
      target?.focus();
    });
  }
}
