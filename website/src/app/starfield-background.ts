/**
 * Procedural Canvas 2D deep-void starfield renderer for the application backdrop.
 * Renders crisp pinpoint stars across three parallax depth layers over pure void black
 * with ultra-slow orbital drift, and freezes cleanly under prefers-reduced-motion.
 */

interface Star {
  /** Normalized horizontal coordinate in [0, 1]. */
  x: number;
  /** Normalized vertical coordinate in [0, 1]. */
  y: number;
  /** CSS pixel radius. */
  radius: number;
  /** Pre-veil alpha in [0, 1]. */
  alpha: number;
  /** Parallax depth factor in [0.25, 1.0]. */
  depth: number;
  /** RGB fill string ("r, g, b"). */
  rgb: string;
  /** Rare first-magnitude stars receive a subtle soft halo. */
  hasHalo: boolean;
}

/** Seeded Mulberry32 PRNG so starfields stay deterministic across resizes, launches, and tests. */
export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STAR_PALETTE: readonly { rgb: string; weight: number }[] = [
  { rgb: '240, 248, 252', weight: 0.64 },
  { rgb: '176, 226, 228', weight: 0.22 },
  { rgb: '136, 204, 204', weight: 0.08 },
  { rgb: '250, 238, 224', weight: 0.06 }
];

const DRIFT_VX_PX_PER_SEC = 1.1;
const DRIFT_VY_PX_PER_SEC = 0.42;

/**
 * Manages the Canvas 2D procedural starfield lifecycle, DPR sizing, and reduced-motion state.
 */
export class StarfieldBackgroundController {
  private readonly ctx: CanvasRenderingContext2D | null;
  private width = 0;
  private height = 0;
  private dpr = 1;

  private stars: Star[] = [];
  private rafId: number | null = null;
  private lastTimestamp = 0;
  private driftTime = 0;
  private isDocumentHidden = false;
  private reducedMotion = false;
  private destroyed = false;

  private resizeObserver: ResizeObserver | null = null;
  private motionQuery: MediaQueryList | null = null;

  private readonly onVisibilityChange = () => {
    this.isDocumentHidden = typeof document !== 'undefined' && document.hidden;
    this.syncLoopState();
  };

  private readonly onMotionChange = (event: MediaQueryListEvent) => {
    this.reducedMotion = event.matches;
    this.syncLoopState();
    this.renderCurrentFrame();
  };

  private readonly onWindowResize = () => {
    this.resize();
    this.renderCurrentFrame();
  };

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly host: HTMLElement
  ) {
    this.ctx = canvas.getContext('2d');
  }

  /** Whether the orbital drift animation loop is currently scheduled. */
  get isRunning(): boolean {
    return this.rafId !== null;
  }

  /** Number of procedural stars currently generated for the viewport. */
  get starCount(): number {
    return this.stars.length;
  }

  /** Whether reduced-motion mode is active (static starfield without animation loop). */
  get isReducedMotion(): boolean {
    return this.reducedMotion;
  }

  /**
   * Initializes observers, generates viewport-scaled stars, and starts rendering.
   */
  start(): void {
    if (this.destroyed || !this.ctx) {
      return;
    }

    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.reducedMotion = this.motionQuery.matches;
      this.motionQuery.addEventListener('change', this.onMotionChange);
    }

    if (typeof document !== 'undefined') {
      this.isDocumentHidden = document.hidden;
      document.addEventListener('visibilitychange', this.onVisibilityChange);
    }

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.resize();
        this.renderCurrentFrame();
      });
      this.resizeObserver.observe(this.host);
    } else if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.onWindowResize, { passive: true });
    }

    this.resize();
    this.renderCurrentFrame();
    this.syncLoopState();
  }

  /**
   * Stops any scheduled animation frame and releases all observers and listeners.
   */
  destroy(): void {
    this.destroyed = true;
    this.stopLoop();

    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.onWindowResize);
    }

    this.motionQuery?.removeEventListener('change', this.onMotionChange);
    this.motionQuery = null;

    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
    }
  }

  /**
   * Measures the host container, updates backing resolution, and scales the star count.
   */
  resize(): void {
    const rect = this.host.getBoundingClientRect();
    const fallbackWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const fallbackHeight = typeof window !== 'undefined' ? window.innerHeight : 720;
    const width = Math.max(1, Math.round(rect.width || fallbackWidth));
    const height = Math.max(1, Math.round(rect.height || fallbackHeight));
    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);

    const dimensionsChanged = width !== this.width || height !== this.height;
    if (!dimensionsChanged && dpr === this.dpr && this.stars.length > 0) {
      return;
    }

    this.width = width;
    this.height = height;
    this.dpr = dpr;

    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    if (dimensionsChanged || this.stars.length === 0) {
      this.generateStars();
    }
  }

  /**
   * Renders a single frame at the current drift offset.
   */
  renderCurrentFrame(): void {
    this.render();
  }

  private generateStars(): void {
    const area = this.width * this.height;
    const count = Math.max(180, Math.min(900, Math.round(area / 3600)));
    const rand = createSeededRandom(2250_0947);
    const stars: Star[] = [];

    for (let i = 0; i < count; i++) {
      const tierRoll = rand();
      let depth: number;
      let radius: number;
      let alpha: number;
      let hasHalo = false;

      if (tierRoll < 0.72) {
        // Distant background dust: crisp sub-pixel pinpoints.
        depth = 0.25 + rand() * 0.2;
        radius = 0.45 + rand() * 0.45;
        alpha = 0.22 + rand() * 0.34;
      } else if (tierRoll < 0.965) {
        // Mid-field navigational stars.
        depth = 0.5 + rand() * 0.25;
        radius = 0.75 + rand() * 0.55;
        alpha = 0.48 + rand() * 0.34;
      } else {
        // Sparse bright stars with a restrained radial halo.
        depth = 0.8 + rand() * 0.2;
        radius = 1.15 + rand() * 0.5;
        alpha = 0.75 + rand() * 0.2;
        hasHalo = true;
      }

      stars.push({
        x: rand(),
        y: rand(),
        radius,
        alpha,
        depth,
        rgb: this.pickStarColor(rand()),
        hasHalo
      });
    }

    this.stars = stars;
  }

  private pickStarColor(roll: number): string {
    let cumulative = 0;
    for (const entry of STAR_PALETTE) {
      cumulative += entry.weight;
      if (roll <= cumulative) {
        return entry.rgb;
      }
    }
    return STAR_PALETTE[0].rgb;
  }

  private syncLoopState(): void {
    const shouldRun = !this.destroyed && !this.reducedMotion && !this.isDocumentHidden;
    if (shouldRun && this.rafId === null) {
      this.lastTimestamp = 0;
      this.rafId = requestAnimationFrame(this.tick);
    } else if (!shouldRun && this.rafId !== null) {
      this.stopLoop();
    }
  }

  private stopLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private readonly tick = (timestamp: number): void => {
    if (this.destroyed) {
      this.rafId = null;
      return;
    }

    if (this.lastTimestamp === 0) {
      this.lastTimestamp = timestamp;
    }

    // Clamp dt so tab-resume never causes a noticeable jump.
    const dt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.1);
    this.lastTimestamp = timestamp;
    this.driftTime += dt;

    this.render();

    if (!this.reducedMotion && !this.isDocumentHidden) {
      this.rafId = requestAnimationFrame(this.tick);
    } else {
      this.rafId = null;
    }
  };

  private render(): void {
    const ctx = this.ctx;
    if (!ctx || this.width <= 0 || this.height <= 0) {
      return;
    }

    ctx.save();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // Pure deep-void black base with an ultra-subtle cold zenith sheen.
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, this.width, this.height);

    const voidGlow = ctx.createRadialGradient(
      this.width * 0.5,
      this.height * 0.35,
      0,
      this.width * 0.5,
      this.height * 0.35,
      Math.max(this.width, this.height) * 0.78
    );
    voidGlow.addColorStop(0, 'rgba(6, 28, 32, 0.24)');
    voidGlow.addColorStop(0.55, 'rgba(2, 12, 14, 0.10)');
    voidGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = voidGlow;
    ctx.fillRect(0, 0, this.width, this.height);

    const w = this.width;
    const h = this.height;
    const t = this.reducedMotion ? 0 : this.driftTime;

    for (const star of this.stars) {
      const offsetX = (DRIFT_VX_PX_PER_SEC * star.depth * t) % w;
      const offsetY = (DRIFT_VY_PX_PER_SEC * star.depth * t) % h;
      const sx = (star.x * w + offsetX + w) % w;
      const sy = (star.y * h + offsetY + h) % h;

      if (star.hasHalo) {
        const haloRadius = star.radius * 3.8;
        const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, haloRadius);
        halo.addColorStop(0, `rgba(${star.rgb}, ${(star.alpha * 0.34).toFixed(3)})`);
        halo.addColorStop(1, `rgba(${star.rgb}, 0)`);
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(sx, sy, haloRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = `rgba(${star.rgb}, ${star.alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, star.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
