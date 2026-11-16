import Preloader from './preloader';
import Game from '../scenes/game';

interface GraphicsStub {
  fillStyle: jasmine.Spy;
  fillRect: jasmine.Spy;
  destroy: jasmine.Spy;
}

interface TextStub {
  setFontSize: jasmine.Spy;
  setFontFamily: jasmine.Spy;
  setColor: jasmine.Spy;
  setAlign: jasmine.Spy;
  setOrigin: jasmine.Spy;
  setText: jasmine.Spy;
  destroy: jasmine.Spy;
}

const makeGraphics = (): GraphicsStub => {
  const graphics = {
    fillStyle: jasmine.createSpy('fillStyle'),
    fillRect: jasmine.createSpy('fillRect'),
    destroy: jasmine.createSpy('destroy')
  };
  graphics.fillStyle.and.returnValue(graphics);
  graphics.fillRect.and.returnValue(graphics);
  return graphics;
};

const makeText = (): TextStub => {
  const text = {
    setFontSize: jasmine.createSpy('setFontSize'),
    setFontFamily: jasmine.createSpy('setFontFamily'),
    setColor: jasmine.createSpy('setColor'),
    setAlign: jasmine.createSpy('setAlign'),
    setOrigin: jasmine.createSpy('setOrigin'),
    setText: jasmine.createSpy('setText'),
    destroy: jasmine.createSpy('destroy')
  };
  [text.setFontSize, text.setFontFamily, text.setColor, text.setAlign, text.setOrigin].forEach(spy =>
    spy.and.returnValue(text)
  );
  return text;
};

interface SceneStub {
  scene: Game;
  load: { on: jasmine.Spy; off: jasmine.Spy };
  graphics: [GraphicsStub, GraphicsStub];
  text: TextStub;
}

const makeScene = (): SceneStub => {
  const load = { on: jasmine.createSpy('load.on'), off: jasmine.createSpy('load.off') };
  const graphics: [GraphicsStub, GraphicsStub] = [makeGraphics(), makeGraphics()];
  const text = makeText();
  const scene = {
    load: load,
    add: {
      graphics: jasmine.createSpy('graphics').and.returnValues(graphics[0], graphics[1]),
      text: jasmine.createSpy('text').and.returnValue(text)
    }
  } as unknown as Game;
  return { scene, load, graphics, text };
};

describe('Preloader', () => {
  it('registers progress and complete listeners on the scene loader', () => {
    const stub = makeScene();

    new Preloader(stub.scene);

    expect(stub.load.on).toHaveBeenCalledWith('progress', jasmine.any(Function));
    expect(stub.load.on).toHaveBeenCalledWith('complete', jasmine.any(Function));
  });

  it('destroys its game objects and removes the loader listeners', () => {
    const stub = makeScene();
    const preloader = new Preloader(stub.scene);

    preloader.destroy();

    expect(stub.load.off).toHaveBeenCalledWith('progress', jasmine.any(Function));
    expect(stub.load.off).toHaveBeenCalledWith('complete', jasmine.any(Function));
    expect(stub.graphics[0].destroy).toHaveBeenCalled();
    expect(stub.graphics[1].destroy).toHaveBeenCalled();
    expect(stub.text.destroy).toHaveBeenCalled();
  });

  it('is safe to destroy repeatedly', () => {
    const stub = makeScene();
    const preloader = new Preloader(stub.scene);

    preloader.destroy();
    preloader.destroy();

    expect(stub.load.off.calls.count()).toBe(2);
    expect(stub.graphics[0].destroy.calls.count()).toBe(1);
  });

  it('ignores loader events after being destroyed', () => {
    const stub = makeScene();
    const preloader = new Preloader(stub.scene);
    const onProgress = stub.load.on.calls.argsFor(0)[1] as (value: number) => void;
    const onComplete = stub.load.on.calls.argsFor(1)[1] as () => void;
    preloader.destroy();

    expect(() => onProgress(0.5)).not.toThrow();
    expect(() => onComplete()).not.toThrow();
    expect(stub.graphics[0].fillRect).not.toHaveBeenCalled();
    expect(stub.text.setText).not.toHaveBeenCalled();
  });
});
