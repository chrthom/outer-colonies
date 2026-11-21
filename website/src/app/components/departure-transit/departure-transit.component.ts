import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  PLATFORM_ID,
  SimpleChanges,
  ViewChild,
  inject
} from '@angular/core';
import { ContentBoxComponent } from '../content-box/content-box.component';
import { createSeededRandom } from 'src/app/starfield-background';

/** Total duration of the planetary transfer burn sequence in normal motion (ms). */
export const DEPARTURE_DURATION_MS = 1840;

/** Brief acknowledgment hold before hop-off when reduced motion is active (ms). */
export const DEPARTURE_REDUCED_MOTION_MS = 280;

const TRANSIT_STAR_PALETTE: readonly { rgb: string; weight: number }[] = [
  { rgb: '240, 248, 252', weight: 0.6 },
  { rgb: '176, 226, 228', weight: 0.22 },
  { rgb: '136, 204, 204', weight: 0.12 },
  { rgb: '250, 238, 224', weight: 0.06 }
];

interface TransitStar {
  angle: number;
  baseRadius: number;
  depth: number;
  size: number;
  alpha: number;
  rgb: string;
}

/**
 * Full-viewport Flight Console departure overlay ("Transferbahn") shown between clicking
 * "Suche nächstes Spiel" and navigating to the Phaser game client.
 */
@Component({
  selector: 'oc-departure-transit',
  templateUrl: './departure-transit.component.html',
  styleUrls: ['./departure-transit.component.scss'],
  imports: [ContentBoxComponent]
})
export class DepartureTransitComponent implements OnChanges, OnDestroy {
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);

  /** Whether the departure sequence is active and covering the viewport. */
  @Input() active = false;

  /** Emitted when the transfer burn completes to trigger client navigation. */
  @Output() readonly complete = new EventEmitter<void>();

  /** Emitted when the player aborts the departure before hop-off (e.g. via Escape). */
  @Output() readonly cancelled = new EventEmitter<void>();

  @ViewChild('overlayContainer') private overlayContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('transitCanvas') private transitCanvas?: ElementRef<HTMLCanvasElement>;

  /** Normalized sequence progress in [0, 1]. */
  progress = 0;

  /** Whether the browser prefers reduced motion. */
  reducedMotion = false;

  private stars: TransitStar[] = [];
  private rafId: number | null = null;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private startTimestamp = 0;
  private completed = false;
  private aborted = false;
  private destroyed = false;
  private width = 0;
  private height = 0;
  private dpr = 1;

  private readonly onResize = () => {
    this.resizeCanvas();
    this.drawFrame(this.progress);
  };

  /** Current Flight Console phase headline in German Mono Caps. */
  get phaseTitle(): string {
    if (this.reducedMotion || (this.progress >= 0.24 && this.progress < 0.78)) {
      return 'Transferbahn aktiv';
    }
    if (this.progress >= 0.78) {
      return 'Übergang zum Client';
    }
    return 'Kursberechnung';
  }

  /** Normalized SVG stroke-dashoffset for the 240-unit Hohmann transfer path. */
  get transferArcOffset(): number {
    const p = this.reducedMotion ? 1 : Math.min(1, Math.max(0, this.progress / 0.82));
    return 240 * (1 - p);
  }

  /** Current vessel pip coordinates along the quadratic Hohmann transfer arc. */
  get vesselPoint(): { x: number; y: number } {
    const t = this.reducedMotion ? 0.72 : Math.min(1, Math.max(0, this.progress / 0.82));
    const u = 1 - t;
    // Control points must match SVG path `M 44 66 Q 142 10 236 26` in the template.
    const x = u * u * 44 + 2 * u * t * 142 + t * t * 236;
    const y = u * u * 66 + 2 * u * t * 10 + t * t * 26;
    return { x, y };
  }

  /** Void seal opacity during the final hand-off beat so the cut into Phaser is seamless. */
  get voidCurtainOpacity(): number {
    if (this.reducedMotion || this.progress < 0.78) {
      return 0;
    }
    return Math.min(1, (this.progress - 0.78) / 0.22);
  }

  /** Updates the running sequence whenever `active` toggles. */
  ngOnChanges(changes: SimpleChanges): void {
    if ('active' in changes) {
      if (this.active) {
        this.startSequence();
      } else {
        this.teardownSequence();
      }
    }
  }

  /** Stops any active animation frame and timers when the component is destroyed. */
  ngOnDestroy(): void {
    this.destroyed = true;
    this.teardownSequence();
  }

  /** Handles Escape to abort and prevents Tab from moving focus behind the active modal overlay. */
  @HostListener('document:keydown', ['$event'])
  onDocumentKeyDown(event: KeyboardEvent): void {
    if (!this.active) {
      return;
    }
    if (event.key === 'Escape') {
      // Once complete has emitted, allow the browser's native Escape stop-loading behavior too.
      if (!this.completed) {
        event.preventDefault();
      }
      this.abort();
      return;
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      this.overlayContainer?.nativeElement.focus({ preventScroll: true });
    }
  }

  /** Aborts or dismisses the departure overlay and notifies the parent page. */
  abort(): void {
    if (!this.active || this.aborted) {
      return;
    }
    this.aborted = true;
    this.teardownSequence();
    this.cancelled.emit();
  }

  private startSequence(): void {
    this.teardownSequence();
    this.completed = false;
    this.aborted = false;
    this.progress = 0;

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.reducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Defer canvas setup and focus one microtask so ViewChild elements exist in the DOM.
    Promise.resolve().then(() => {
      if (!this.active || this.destroyed || this.aborted) {
        return;
      }
      this.overlayContainer?.nativeElement.focus({ preventScroll: true });
      this.initStars();
      this.resizeCanvas();

      if (this.reducedMotion) {
        this.progress = 1;
        this.drawFrame(0);
        this.timeoutId = setTimeout(() => this.finishSequence(), DEPARTURE_REDUCED_MOTION_MS);
        return;
      }

      window.addEventListener('resize', this.onResize, { passive: true });
      this.drawFrame(0);
      this.ngZone.runOutsideAngular(() => {
        this.startTimestamp = 0;
        this.rafId = requestAnimationFrame(this.tick);
      });
    });
  }

  private finishSequence(): void {
    if (!this.active || this.completed || this.aborted) {
      return;
    }
    this.completed = true;
    this.progress = 1;
    this.teardownSequence();
    this.complete.emit();
  }

  private teardownSequence(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (isPlatformBrowser(this.platformId) && typeof window !== 'undefined') {
      window.removeEventListener('resize', this.onResize);
    }
  }

  private readonly tick = (timestamp: number): void => {
    if (!this.active || this.completed || this.aborted) {
      this.rafId = null;
      return;
    }

    if (this.startTimestamp === 0) {
      this.startTimestamp = timestamp;
    }

    const elapsed = timestamp - this.startTimestamp;
    const rawProgress = Math.min(1, elapsed / DEPARTURE_DURATION_MS);

    this.progress = rawProgress;
    this.cdr.detectChanges();
    this.drawFrame(rawProgress);

    if (rawProgress >= 1) {
      this.ngZone.run(() => this.finishSequence());
      return;
    }

    this.rafId = requestAnimationFrame(this.tick);
  };

  private initStars(): void {
    const rand = createSeededRandom(2250_2026);
    const stars: TransitStar[] = [];
    for (let i = 0; i < 220; i++) {
      stars.push({
        angle: rand() * Math.PI * 2,
        baseRadius: 0.04 + Math.pow(rand(), 0.72) * 0.96,
        depth: 0.35 + rand() * 0.65,
        size: 0.55 + rand() * 1.15,
        alpha: 0.32 + rand() * 0.62,
        rgb: this.pickStarColor(rand())
      });
    }
    this.stars = stars;
  }

  private pickStarColor(roll: number): string {
    let acc = 0;
    for (const entry of TRANSIT_STAR_PALETTE) {
      acc += entry.weight;
      if (roll <= acc) {
        return entry.rgb;
      }
    }
    return TRANSIT_STAR_PALETTE[0].rgb;
  }

  private resizeCanvas(): void {
    const canvas = this.transitCanvas?.nativeElement;
    if (!canvas || typeof window === 'undefined') {
      return;
    }
    const rect = this.overlayContainer?.nativeElement.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect?.width || window.innerWidth));
    const height = Math.max(1, Math.round(rect?.height || window.innerHeight));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.width = width;
    this.height = height;
    this.dpr = dpr;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }

  private drawFrame(progress: number): void {
    const canvas = this.transitCanvas?.nativeElement;
    const ctx = canvas?.getContext('2d');
    if (!ctx || this.width <= 0 || this.height <= 0) {
      return;
    }

    const w = this.width;
    const h = this.height;
    const cx = w * 0.5;
    const cy = h * 0.46;
    const maxRadius = Math.hypot(cx, cy) * 1.15;

    ctx.save();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Smooth cubic acceleration of sub-light orbital burn without warp-tunnel distortion.
    const thrust = this.reducedMotion ? 0 : progress * progress * (2.2 - 1.2 * progress);
    const reticleAlpha = this.reducedMotion ? 0.22 : 0.16 + Math.sin(progress * Math.PI) * 0.18;

    ctx.strokeStyle = `rgba(136, 204, 204, ${reticleAlpha.toFixed(3)})`;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 10]);
    const innerRing = Math.min(w, h) * (0.16 + thrust * 0.05);
    const outerRing = Math.min(w, h) * (0.31 + thrust * 0.08);

    ctx.beginPath();
    ctx.arc(cx, cy, innerRing, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, outerRing, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = `rgba(224, 184, 184, ${(reticleAlpha * 1.25).toFixed(3)})`;
    for (let q = 0; q < 4; q++) {
      const a = (q * Math.PI) / 2;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      ctx.beginPath();
      ctx.moveTo(cx + cos * (outerRing - 6), cy + sin * (outerRing - 6));
      ctx.lineTo(cx + cos * (outerRing + 6), cy + sin * (outerRing + 6));
      ctx.stroke();
    }

    for (const star of this.stars) {
      const travel = thrust * (0.28 + star.depth * 0.92);
      const rNorm = (star.baseRadius + travel) % 1.04;
      const rPx = Math.max(12, rNorm * maxRadius);
      const x = cx + Math.cos(star.angle) * rPx;
      const y = cy + Math.sin(star.angle) * rPx;

      const trailLength = this.reducedMotion ? 0 : Math.min(22, thrust * 24 * star.depth * (0.35 + rNorm));
      if (trailLength > 1.5) {
        const tailR = Math.max(8, rPx - trailLength);
        const tx = cx + Math.cos(star.angle) * tailR;
        const ty = cy + Math.sin(star.angle) * tailR;

        const grad = ctx.createLinearGradient(tx, ty, x, y);
        grad.addColorStop(0, `rgba(${star.rgb}, 0)`);
        grad.addColorStop(1, `rgba(${star.rgb}, ${star.alpha.toFixed(3)})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = star.size;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(x, y);
        ctx.stroke();
      }

      ctx.fillStyle = `rgba(${star.rgb}, ${star.alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(x, y, star.size * 0.72, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
