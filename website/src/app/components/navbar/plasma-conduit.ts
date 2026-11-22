/**
 * Interactive Canvas 2D plasma conduit renderer for the Flight-Console header bar.
 * Streams laminar Signal Teal energy filaments and telemetry packets at rest, and
 * deflects into an Alert Red magnetic wake when hovered or keyboard-focused.
 */

interface Filament {
  lane: number;
  amplitude: number;
  freq1: number;
  freq2: number;
  speed1: number;
  speed2: number;
  phase1: number;
  phase2: number;
  baseAlpha: number;
  lineWidth: number;
  isCore: boolean;
}

interface TelemetryPacket {
  filamentIndex: number;
  x: number;
  speed: number;
  length: number;
  thickness: number;
  alpha: number;
}

interface Shockwave {
  originX: number;
  age: number;
  maxAge: number;
  speed: number;
  strength: number;
}

const FILAMENTS: readonly Filament[] = [
  {
    lane: 0.2,
    amplitude: 2.0,
    freq1: 0.0085,
    freq2: 0.021,
    speed1: 1.45,
    speed2: 2.8,
    phase1: 0.4,
    phase2: 1.7,
    baseAlpha: 0.24,
    lineWidth: 0.85,
    isCore: false
  },
  {
    lane: 0.33,
    amplitude: 3.1,
    freq1: 0.011,
    freq2: 0.026,
    speed1: 2.05,
    speed2: 3.4,
    phase1: 1.9,
    phase2: 0.5,
    baseAlpha: 0.36,
    lineWidth: 1.0,
    isCore: false
  },
  {
    lane: 0.43,
    amplitude: 3.8,
    freq1: 0.0135,
    freq2: 0.019,
    speed1: 2.65,
    speed2: 4.1,
    phase1: 3.1,
    phase2: 2.4,
    baseAlpha: 0.5,
    lineWidth: 1.25,
    isCore: true
  },
  {
    lane: 0.5,
    amplitude: 4.4,
    freq1: 0.01,
    freq2: 0.024,
    speed1: 3.15,
    speed2: 4.7,
    phase1: 0.8,
    phase2: 3.9,
    baseAlpha: 0.68,
    lineWidth: 1.5,
    isCore: true
  },
  {
    lane: 0.58,
    amplitude: 3.6,
    freq1: 0.0125,
    freq2: 0.029,
    speed1: 2.45,
    speed2: 3.8,
    phase1: 4.4,
    phase2: 1.2,
    baseAlpha: 0.48,
    lineWidth: 1.2,
    isCore: true
  },
  {
    lane: 0.68,
    amplitude: 2.9,
    freq1: 0.0095,
    freq2: 0.022,
    speed1: 1.85,
    speed2: 3.1,
    phase1: 2.2,
    phase2: 4.8,
    baseAlpha: 0.34,
    lineWidth: 1.0,
    isCore: false
  },
  {
    lane: 0.8,
    amplitude: 2.1,
    freq1: 0.008,
    freq2: 0.018,
    speed1: 1.35,
    speed2: 2.5,
    phase1: 5.1,
    phase2: 3.0,
    baseAlpha: 0.24,
    lineWidth: 0.85,
    isCore: false
  }
];

const PACKET_COUNT = 22;
const MAX_SHOCKWAVES = 6;
const DEFLECTION_RADIUS_X = 165;
const THERMAL_RADIUS_X = 220;

const lerpChannel = (a: number, b: number, t: number): number => Math.round(a + (b - a) * t);

/**
 * Manages the lifecycle, physics state, and Canvas 2D rendering of the navbar energy stream.
 */
export class PlasmaConduitController {
  private readonly ctx: CanvasRenderingContext2D | null;
  private width = 0;
  private height = 0;
  private dpr = 1;

  private rafId: number | null = null;
  private lastTimestamp = 0;
  private simTime = 0;
  private isVisible = true;
  private isDocumentHidden = false;
  private reducedMotion = false;
  private destroyed = false;

  // Interactive pointer / focus state
  private hasActiveTarget = false;
  private targetX = 0;
  private targetY = 31;
  private currentX = 0;
  private currentY = 31;
  private energy = 0;
  private velocityBoost = 0;
  private lastWaveSpawnTime = -1;

  private packets: TelemetryPacket[] = [];
  private shockwaves: Shockwave[] = [];

  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
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

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly host: HTMLElement
  ) {
    this.ctx = canvas.getContext('2d');
    this.initPackets();
  }

  /** Whether the 60fps animation loop is currently scheduled. */
  get isRunning(): boolean {
    return this.rafId !== null;
  }

  /** Current smoothed hover/focus excitation energy in [0, 1]. */
  get energyLevel(): number {
    return this.energy;
  }

  /** Number of active rail shockwave pulses currently propagating. */
  get activeShockwaveCount(): number {
    return this.shockwaves.length;
  }

  /**
   * Initializes observers, measures the host container, and starts the stream.
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
    }

    if (typeof IntersectionObserver !== 'undefined') {
      this.intersectionObserver = new IntersectionObserver(entries => {
        const entry = entries[0];
        if (entry) {
          this.isVisible = entry.isIntersecting;
          this.syncLoopState();
        }
      });
      this.intersectionObserver.observe(this.host);
    }

    this.resize();
    this.renderCurrentFrame();
    this.syncLoopState();
  }

  /**
   * Stops animation frames and releases all DOM observers and listeners.
   */
  destroy(): void {
    this.destroyed = true;
    this.stopLoop();

    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    this.intersectionObserver?.disconnect();
    this.intersectionObserver = null;

    this.motionQuery?.removeEventListener('change', this.onMotionChange);
    this.motionQuery = null;

    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
    }
  }

  /**
   * Updates the magnetic deflector coordinates from a pointer event inside the host bar.
   * @param clientX Viewport X coordinate
   * @param clientY Viewport Y coordinate
   */
  setPointer(clientX: number, clientY: number): void {
    const rect = this.host.getBoundingClientRect();
    const width = rect.width || this.width;
    const height = rect.height || this.height || 62;
    if (width <= 0) {
      return;
    }

    const localX = Math.max(0, Math.min(width, clientX - rect.left));
    const localY = Math.max(0, Math.min(height, clientY - rect.top));
    this.activateTarget(localX, localY);
  }

  /**
   * Activates a magnetic excitation point in host-local CSS coordinates (used by keyboard focus).
   * @param localX Horizontal offset inside the navbar
   * @param localY Vertical offset inside the navbar
   */
  setLocalTarget(localX: number, localY: number): void {
    this.activateTarget(localX, localY);
  }

  /**
   * Releases the hover/focus target so the conduit smoothly cools back to Signal Teal.
   */
  clearTarget(): void {
    this.hasActiveTarget = false;
    if (this.reducedMotion) {
      this.energy = 0;
      this.velocityBoost = 0;
      this.renderCurrentFrame();
    }
  }

  /**
   * Advances physics and draws a single frame (exposed for deterministic unit tests).
   * @param dt Delta time in seconds
   */
  stepAndRender(dt: number): void {
    const clampedDt = Math.max(0, Math.min(dt, 0.05));
    this.updatePhysics(clampedDt);
    this.renderCurrentFrame();
  }

  private activateTarget(localX: number, localY: number): void {
    const wasActive = this.hasActiveTarget;
    const dx = localX - this.targetX;

    this.hasActiveTarget = true;
    this.targetX = localX;
    this.targetY = localY;

    if (!wasActive) {
      this.currentX = localX;
      this.currentY = localY;
      this.spawnShockwave(localX, 0.9);
    } else {
      const speedKick = Math.min(1, Math.abs(dx) / 55);
      this.velocityBoost = Math.min(1, Math.max(this.velocityBoost, speedKick));
      if (Math.abs(dx) > 18 && this.simTime - this.lastWaveSpawnTime > 0.11) {
        this.spawnShockwave(localX, 0.45 + 0.45 * speedKick);
      }
    }

    if (this.reducedMotion) {
      this.currentX = localX;
      this.currentY = localY;
      this.energy = 1;
      this.renderCurrentFrame();
    }
  }

  private spawnShockwave(originX: number, strength: number): void {
    if (this.reducedMotion) {
      return;
    }
    this.lastWaveSpawnTime = this.simTime;
    if (this.shockwaves.length >= MAX_SHOCKWAVES) {
      this.shockwaves.shift();
    }
    this.shockwaves.push({
      originX,
      age: 0,
      maxAge: 0.72,
      speed: 380,
      strength
    });
  }

  private initPackets(): void {
    this.packets = [];
    for (let i = 0; i < PACKET_COUNT; i++) {
      const filamentIndex = i % FILAMENTS.length;
      const seed = (i * 0.6180339887) % 1;
      const seed2 = ((i * 0.3819660113 + 0.17) * 7) % 1;
      this.packets.push({
        filamentIndex,
        x: seed * 1400,
        speed: 88 + seed2 * 145,
        length: 14 + seed * 28,
        thickness: FILAMENTS[filamentIndex].isCore ? 1.8 : 1.2,
        alpha: 0.45 + seed2 * 0.42
      });
    }
  }

  private resize(): void {
    const rect = this.host.getBoundingClientRect();
    const nextWidth = Math.round(rect.width || this.host.clientWidth);
    const nextHeight = Math.round(rect.height || this.host.clientHeight);
    if (nextWidth <= 0 || nextHeight <= 0) {
      return;
    }

    const nextDpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;

    if (nextWidth === this.width && nextHeight === this.height && nextDpr === this.dpr) {
      return;
    }

    const prevWidth = this.width;
    this.width = nextWidth;
    this.height = nextHeight;
    this.dpr = nextDpr;

    this.canvas.width = Math.round(nextWidth * nextDpr);
    this.canvas.height = Math.round(nextHeight * nextDpr);

    if (prevWidth > 0) {
      const scale = nextWidth / prevWidth;
      for (const packet of this.packets) {
        packet.x *= scale;
      }
    } else {
      for (let i = 0; i < this.packets.length; i++) {
        this.packets[i].x = ((i * 0.6180339887) % 1) * nextWidth;
      }
      this.currentX = nextWidth * 0.5;
      this.currentY = nextHeight * 0.5;
      this.targetX = this.currentX;
      this.targetY = this.currentY;
    }
  }

  private syncLoopState(): void {
    const shouldRun =
      !this.destroyed && !this.reducedMotion && this.isVisible && !this.isDocumentHidden && !!this.ctx;

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
    this.rafId = null;
    if (this.destroyed || this.reducedMotion || !this.isVisible || this.isDocumentHidden) {
      return;
    }

    if (this.lastTimestamp === 0) {
      this.lastTimestamp = timestamp;
    }
    const rawDt = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    this.stepAndRender(rawDt);

    if (!this.destroyed && !this.reducedMotion && this.isVisible && !this.isDocumentHidden) {
      this.rafId = requestAnimationFrame(this.tick);
    }
  };

  private updatePhysics(dt: number): void {
    if (dt <= 0) {
      return;
    }

    this.simTime += dt;

    // Smooth exponential attack/release for interaction energy
    const targetEnergy = this.hasActiveTarget ? 1 : 0;
    const rate = this.hasActiveTarget ? 12 : 4.2;
    const blend = 1 - Math.exp(-rate * dt);
    this.energy += (targetEnergy - this.energy) * blend;
    if (!this.hasActiveTarget && this.energy < 0.002) {
      this.energy = 0;
    }

    const pointerBlend = 1 - Math.exp(-20 * dt);
    this.currentX += (this.targetX - this.currentX) * pointerBlend;
    this.currentY += (this.targetY - this.currentY) * pointerBlend;
    this.velocityBoost *= Math.exp(-5 * dt);

    const wrapWidth = this.width > 0 ? this.width : 1200;
    for (const packet of this.packets) {
      const dx = packet.x - this.currentX;
      const influence = this.energy * Math.exp(-(dx * dx) / (2 * DEFLECTION_RADIUS_X * DEFLECTION_RADIUS_X));
      const speedMultiplier = 1 + influence * (1.1 + 0.7 * this.velocityBoost);
      packet.x += packet.speed * speedMultiplier * dt;
      if (packet.x - packet.length > wrapWidth + 20) {
        packet.x = -packet.length - 10;
      }
    }

    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      this.shockwaves[i].age += dt;
      if (this.shockwaves[i].age >= this.shockwaves[i].maxAge) {
        this.shockwaves.splice(i, 1);
      }
    }
  }

  private sampleFilamentY(filament: Filament, x: number): number {
    const h = this.height;
    const baseY = filament.lane * h;
    const wave =
      Math.sin(x * filament.freq1 - this.simTime * filament.speed1 + filament.phase1) * filament.amplitude +
      Math.sin(x * filament.freq2 - this.simTime * filament.speed2 + filament.phase2) *
        (filament.amplitude * 0.42);

    let y = baseY + wave;

    if (this.energy > 0.005) {
      const radiusX = DEFLECTION_RADIUS_X + this.velocityBoost * 45;
      const dx = x - this.currentX;
      const hx = Math.exp(-(dx * dx) / (2 * radiusX * radiusX));
      if (hx > 0.005) {
        const dy = y - this.currentY;
        // C1-smooth magnetic parting around the cursor + high-frequency plasma excitation
        const parting =
          (dy / Math.sqrt(dy * dy + 64)) *
          Math.exp(-(dy * dy) / 760) *
          hx *
          this.energy *
          (12 + 4 * this.velocityBoost);
        const ripple =
          Math.sin(x * 0.085 - this.simTime * 10.5 + filament.phase1 * 2) *
          hx *
          this.energy *
          (2.2 + 1.8 * this.velocityBoost);
        y += parting + ripple;
      }
    }

    return Math.max(3, Math.min(h - 3, y));
  }

  private renderCurrentFrame(): void {
    const ctx = this.ctx;
    if (!ctx || this.width <= 0 || this.height <= 0) {
      return;
    }

    const w = this.width;
    const h = this.height;

    ctx.save();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    this.drawAmbientStreamGlow(ctx, w, h);
    this.drawFilaments(ctx, w, h);
    this.drawPackets(ctx, w);
    this.drawContainmentRails(ctx, w, h);
    this.drawShockwaves(ctx, w, h);

    ctx.restore();
  }

  private drawAmbientStreamGlow(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    // Subtle laminar teal channel glow echoing the console bar's dark-left to teal-right profile
    const channelGrad = ctx.createLinearGradient(0, 0, w, 0);
    channelGrad.addColorStop(0, 'rgba(10, 124, 124, 0.02)');
    channelGrad.addColorStop(0.42, 'rgba(17, 153, 153, 0.08)');
    channelGrad.addColorStop(1, 'rgba(17, 153, 153, 0.16)');
    ctx.fillStyle = channelGrad;
    ctx.fillRect(0, h * 0.18, w, h * 0.64);

    if (this.energy > 0.005) {
      // Anisotropic horizontal Alert Red thermal bloom around the cursor
      ctx.save();
      ctx.translate(this.currentX, this.currentY);
      ctx.scale(2.9, 0.72);
      const radius = 85;
      const thermal = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
      thermal.addColorStop(0, `rgba(255, 53, 53, ${0.24 * this.energy})`);
      thermal.addColorStop(0.45, `rgba(153, 17, 17, ${0.18 * this.energy})`);
      thermal.addColorStop(1, 'rgba(153, 17, 17, 0)');
      ctx.fillStyle = thermal;
      ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
      ctx.restore();
    }
  }

  private drawFilaments(ctx: CanvasRenderingContext2D, w: number, _h: number): void {
    const step = Math.max(8, Math.min(14, Math.floor(w / 110)));

    // Build shared teal gradients once per frame
    const tealGlowGrad = ctx.createLinearGradient(0, 0, w, 0);
    tealGlowGrad.addColorStop(0, 'rgba(10, 124, 124, 0.06)');
    tealGlowGrad.addColorStop(0.35, 'rgba(17, 153, 153, 0.20)');
    tealGlowGrad.addColorStop(1, 'rgba(17, 153, 153, 0.30)');

    const tealCoreGrad = ctx.createLinearGradient(0, 0, w, 0);
    tealCoreGrad.addColorStop(0, 'rgba(17, 153, 153, 0.22)');
    tealCoreGrad.addColorStop(0.4, 'rgba(17, 153, 153, 0.52)');
    tealCoreGrad.addColorStop(1, 'rgba(136, 204, 204, 0.74)');

    let redThermalGrad: CanvasGradient | null = null;
    let redCoreGrad: CanvasGradient | null = null;
    if (this.energy > 0.01) {
      const rLeft = this.currentX - THERMAL_RADIUS_X;
      const rRight = this.currentX + THERMAL_RADIUS_X;

      redThermalGrad = ctx.createLinearGradient(rLeft, 0, rRight, 0);
      redThermalGrad.addColorStop(0, 'rgba(153, 17, 17, 0)');
      redThermalGrad.addColorStop(0.18, `rgba(153, 17, 17, ${0.28 * this.energy})`);
      redThermalGrad.addColorStop(0.36, `rgba(200, 32, 32, ${0.72 * this.energy})`);
      redThermalGrad.addColorStop(0.5, `rgba(255, 53, 53, ${0.95 * this.energy})`);
      redThermalGrad.addColorStop(0.64, `rgba(200, 32, 32, ${0.72 * this.energy})`);
      redThermalGrad.addColorStop(0.82, `rgba(153, 17, 17, ${0.28 * this.energy})`);
      redThermalGrad.addColorStop(1, 'rgba(153, 17, 17, 0)');

      redCoreGrad = ctx.createLinearGradient(rLeft, 0, rRight, 0);
      redCoreGrad.addColorStop(0, 'rgba(255, 53, 53, 0)');
      redCoreGrad.addColorStop(0.24, `rgba(255, 53, 53, ${0.35 * this.energy})`);
      redCoreGrad.addColorStop(0.38, `rgba(255, 95, 95, ${0.76 * this.energy})`);
      redCoreGrad.addColorStop(0.5, `rgba(224, 184, 184, ${0.96 * this.energy})`);
      redCoreGrad.addColorStop(0.62, `rgba(255, 95, 95, ${0.76 * this.energy})`);
      redCoreGrad.addColorStop(0.76, `rgba(255, 53, 53, ${0.35 * this.energy})`);
      redCoreGrad.addColorStop(1, 'rgba(255, 53, 53, 0)');
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const filament of FILAMENTS) {
      ctx.beginPath();
      for (let x = 0; x <= w + step; x += step) {
        const clampedX = Math.min(w, x);
        const y = this.sampleFilamentY(filament, clampedX);
        if (x === 0) {
          ctx.moveTo(0, y);
        } else {
          ctx.lineTo(clampedX, y);
        }
      }

      // 1. Teal outer plasma halo
      ctx.globalAlpha = filament.baseAlpha * 0.55;
      ctx.strokeStyle = tealGlowGrad;
      ctx.lineWidth = filament.lineWidth * 3.2;
      ctx.stroke();

      // 2. Teal crisp filament core
      ctx.globalAlpha = filament.baseAlpha;
      ctx.strokeStyle = filament.isCore ? tealCoreGrad : tealGlowGrad;
      ctx.lineWidth = filament.lineWidth;
      ctx.stroke();

      // 3. Localized Alert Red magnetic wake overdraw
      if (redThermalGrad && redCoreGrad) {
        ctx.globalAlpha = filament.baseAlpha * 0.85;
        ctx.strokeStyle = redThermalGrad;
        ctx.lineWidth = filament.lineWidth * 2.6;
        ctx.stroke();

        ctx.globalAlpha = Math.min(1, filament.baseAlpha + 0.25);
        ctx.strokeStyle = filament.isCore ? redCoreGrad : redThermalGrad;
        ctx.lineWidth = filament.lineWidth * 1.15;
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  private drawPackets(ctx: CanvasRenderingContext2D, w: number): void {
    for (const packet of this.packets) {
      const filament = FILAMENTS[packet.filamentIndex];
      const headX = packet.x;
      const dxCenter = headX - this.currentX;
      const redMix = this.energy * Math.exp(-(dxCenter * dxCenter) / (2 * (DEFLECTION_RADIUS_X * 0.85) ** 2));

      const effectiveLen = packet.length * (1 + redMix * 0.45);
      const tailX = headX - effectiveLen;
      if (headX < -10 || tailX > w + 10) {
        continue;
      }

      const headY = this.sampleFilamentY(filament, Math.max(0, Math.min(w, headX)));
      const tailY = this.sampleFilamentY(filament, Math.max(0, Math.min(w, tailX)));

      const grad = ctx.createLinearGradient(tailX, tailY, headX, headY);
      const midR = lerpChannel(17, 255, redMix);
      const midG = lerpChannel(153, 53, redMix);
      const midB = lerpChannel(153, 53, redMix);
      const headR = lerpChannel(136, 224, redMix);
      const headG = lerpChannel(204, 184, redMix);
      const headB = lerpChannel(204, 184, redMix);
      const effectiveAlpha = Math.min(1, packet.alpha + redMix * 0.35);

      grad.addColorStop(0, `rgba(${midR}, ${midG}, ${midB}, 0)`);
      grad.addColorStop(0.55, `rgba(${midR}, ${midG}, ${midB}, ${effectiveAlpha * (0.65 + 0.08 * redMix)})`);
      grad.addColorStop(1, `rgba(${headR}, ${headG}, ${headB}, ${effectiveAlpha})`);

      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(headX, headY);
      ctx.strokeStyle = grad;
      ctx.lineWidth = packet.thickness * (1 + redMix * 0.35);
      ctx.stroke();
    }
  }

  private drawContainmentRails(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    // Subtle luminous containment lines hugging the top and bottom ridge borders
    const railGrad = ctx.createLinearGradient(0, 0, w, 0);
    railGrad.addColorStop(0, 'rgba(17, 153, 153, 0.1)');
    railGrad.addColorStop(0.5, 'rgba(17, 153, 153, 0.32)');
    railGrad.addColorStop(1, 'rgba(136, 204, 204, 0.45)');

    ctx.fillStyle = railGrad;
    ctx.fillRect(0, 0, w, 1);
    ctx.fillRect(0, h - 1, w, 1);

    if (this.energy > 0.02) {
      const span = 150;
      const flareGrad = ctx.createLinearGradient(this.currentX - span, 0, this.currentX + span, 0);
      flareGrad.addColorStop(0, 'rgba(153, 17, 17, 0)');
      flareGrad.addColorStop(0.35, `rgba(255, 53, 53, ${0.65 * this.energy})`);
      flareGrad.addColorStop(0.5, `rgba(224, 184, 184, ${0.95 * this.energy})`);
      flareGrad.addColorStop(0.65, `rgba(255, 53, 53, ${0.65 * this.energy})`);
      flareGrad.addColorStop(1, 'rgba(153, 17, 17, 0)');

      ctx.fillStyle = flareGrad;
      ctx.fillRect(Math.max(0, this.currentX - span), 0, span * 2, 1.5);
      ctx.fillRect(Math.max(0, this.currentX - span), h - 1.5, span * 2, 1.5);

      // Precision Flight-Console caliper ticks marking the magnetic probe X position
      ctx.fillStyle = `rgba(224, 184, 184, ${0.85 * this.energy})`;
      ctx.fillRect(Math.round(this.currentX) - 0.5, 0, 1, 5);
      ctx.fillRect(Math.round(this.currentX) - 0.5, h - 5, 1, 5);
    }
  }

  private drawShockwaves(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    for (const wave of this.shockwaves) {
      const progress = wave.age / wave.maxAge;
      const alpha = (1 - progress) * (1 - progress) * wave.strength * 0.75;
      if (alpha <= 0.01) {
        continue;
      }

      const dist = wave.age * wave.speed;
      const leftX = wave.originX - dist;
      const rightX = wave.originX + dist;
      const pulseLen = 36;

      ctx.lineWidth = 1.5;

      if (leftX + pulseLen >= 0 && leftX <= w) {
        const gLeft = ctx.createLinearGradient(leftX, 0, leftX + pulseLen, 0);
        gLeft.addColorStop(0, `rgba(255, 53, 53, ${alpha})`);
        gLeft.addColorStop(1, 'rgba(153, 17, 17, 0)');
        ctx.fillStyle = gLeft;
        ctx.fillRect(leftX, 0, pulseLen, 2);
        ctx.fillRect(leftX, h - 2, pulseLen, 2);
      }

      if (rightX >= 0 && rightX - pulseLen <= w) {
        const gRight = ctx.createLinearGradient(rightX - pulseLen, 0, rightX, 0);
        gRight.addColorStop(0, 'rgba(153, 17, 17, 0)');
        gRight.addColorStop(1, `rgba(255, 53, 53, ${alpha})`);
        ctx.fillStyle = gRight;
        ctx.fillRect(rightX - pulseLen, 0, pulseLen, 2);
        ctx.fillRect(rightX - pulseLen, h - 2, pulseLen, 2);
      }
    }
  }
}
