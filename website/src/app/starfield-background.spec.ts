import { StarfieldBackgroundController } from './starfield-background';

describe('StarfieldBackgroundController', () => {
  let host: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  let controller: StarfieldBackgroundController;

  beforeEach(() => {
    host = document.createElement('div');
    host.style.width = '1280px';
    host.style.height = '720px';
    document.body.appendChild(host);

    canvas = document.createElement('canvas');
    host.appendChild(canvas);

    spyOn(host, 'getBoundingClientRect').and.returnValue({
      left: 0,
      top: 0,
      right: 1280,
      bottom: 720,
      width: 1280,
      height: 720,
      x: 0,
      y: 0,
      toJSON: () => ({})
    });

    controller = new StarfieldBackgroundController(canvas, host);
  });

  afterEach(() => {
    controller.destroy();
    host.remove();
  });

  it('should size the canvas backing store and generate deterministic stars', () => {
    controller.start();

    expect(canvas.width).toBeGreaterThanOrEqual(1280);
    expect(canvas.height).toBeGreaterThanOrEqual(720);
    expect(controller.starCount).toBeGreaterThanOrEqual(180);
    expect(controller.starCount).toBeLessThanOrEqual(900);
  });

  it('should respect prefers-reduced-motion by rendering statically without an animation loop', () => {
    const listeners: Array<(event: MediaQueryListEvent) => void> = [];
    const fakeQuery = {
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: (_type: string, cb: (event: MediaQueryListEvent) => void) => listeners.push(cb),
      removeEventListener: jasmine.createSpy('removeEventListener'),
      addListener: jasmine.createSpy('addListener'),
      removeListener: jasmine.createSpy('removeListener'),
      dispatchEvent: () => false
    } as unknown as MediaQueryList;

    spyOn(window, 'matchMedia').and.returnValue(fakeQuery);

    controller.start();
    expect(controller.isReducedMotion).toBeTrue();
    expect(controller.isRunning).toBeFalse();

    // Toggling reduced motion off should start the drift loop
    listeners.forEach(cb => cb({ matches: false } as MediaQueryListEvent));
    expect(controller.isReducedMotion).toBeFalse();
    expect(controller.isRunning).toBeTrue();
  });

  it('should degrade gracefully when a 2D canvas context is unavailable', () => {
    const headlessCanvas = document.createElement('canvas');
    spyOn(headlessCanvas, 'getContext').and.returnValue(null);
    const fallbackController = new StarfieldBackgroundController(headlessCanvas, host);

    expect(() => fallbackController.start()).not.toThrow();
    expect(fallbackController.isRunning).toBeFalse();
    fallbackController.destroy();
  });

  it('should stop the animation loop on destroy', () => {
    controller.start();
    controller.destroy();
    expect(controller.isRunning).toBeFalse();
  });
});
