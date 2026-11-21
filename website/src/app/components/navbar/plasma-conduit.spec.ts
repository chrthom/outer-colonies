import { PlasmaConduitController } from './plasma-conduit';

describe('PlasmaConduitController', () => {
  let host: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  let controller: PlasmaConduitController;

  beforeEach(() => {
    host = document.createElement('div');
    host.style.width = '800px';
    host.style.height = '62px';
    document.body.appendChild(host);

    canvas = document.createElement('canvas');
    host.appendChild(canvas);

    spyOn(host, 'getBoundingClientRect').and.returnValue({
      left: 0,
      top: 0,
      right: 800,
      bottom: 62,
      width: 800,
      height: 62,
      x: 0,
      y: 0,
      toJSON: () => ({})
    });

    controller = new PlasmaConduitController(canvas, host);
  });

  afterEach(() => {
    controller.destroy();
    host.remove();
  });

  it('should size the canvas backing store and start without throwing', () => {
    controller.start();
    expect(canvas.width).toBeGreaterThanOrEqual(800);
    expect(canvas.height).toBeGreaterThanOrEqual(62);
    expect(controller.energyLevel).toBe(0);
  });

  it('should excite energy and spawn a shockwave on pointer enter and cool down on clear', () => {
    controller.start();

    controller.setPointer(320, 31);
    expect(controller.activeShockwaveCount).toBe(1);

    // Advance several simulation steps while hovering
    for (let i = 0; i < 10; i++) {
      controller.stepAndRender(0.03);
    }
    expect(controller.energyLevel).toBeGreaterThan(0.8);

    // Clear target and verify smooth cool-down back toward idle teal
    controller.clearTarget();
    for (let i = 0; i < 40; i++) {
      controller.stepAndRender(0.05);
    }
    expect(controller.energyLevel).toBeLessThan(0.05);
  });

  it('should respect prefers-reduced-motion by not scheduling an animation loop', () => {
    const fakeQuery = {
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: jasmine.createSpy('addEventListener'),
      removeEventListener: jasmine.createSpy('removeEventListener'),
      addListener: jasmine.createSpy('addListener'),
      removeListener: jasmine.createSpy('removeListener'),
      dispatchEvent: () => false
    } as unknown as MediaQueryList;

    spyOn(window, 'matchMedia').and.returnValue(fakeQuery);

    controller.start();
    expect(controller.isRunning).toBeFalse();

    controller.setPointer(200, 30);
    expect(controller.energyLevel).toBe(1);
    expect(controller.activeShockwaveCount).toBe(0);

    controller.clearTarget();
    expect(controller.energyLevel).toBe(0);
  });

  it('should degrade gracefully when 2D canvas context is unavailable', () => {
    const noCtxCanvas = document.createElement('canvas');
    spyOn(noCtxCanvas, 'getContext').and.returnValue(null);

    const degraded = new PlasmaConduitController(noCtxCanvas, host);
    expect(() => {
      degraded.start();
      degraded.setPointer(100, 20);
      degraded.stepAndRender(0.016);
      degraded.clearTarget();
      degraded.destroy();
    }).not.toThrow();
    expect(degraded.isRunning).toBeFalse();
  });

  it('should stop the animation loop on destroy', () => {
    controller.start();
    controller.destroy();
    expect(controller.isRunning).toBeFalse();
  });
});
