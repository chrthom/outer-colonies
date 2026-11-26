import { EnvironmentInjector, createEnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import Phaser from 'phaser';
import { GameInteractionService } from '../services/game_interaction_service';
import { GameSessionService } from '../services/game_session_service';
import { SchedulerService } from '../services/scheduler_service';
import { SocketService } from '../socket_service';
import { makeSocketStub } from '../testing/phaser_stubs';
import OptionPicker from './option_picker';

// The production bundle exposes Phaser as a global (see src/index.html) and CardImage
// relies on that global, so make sure the test bundle provides it as well.
(globalThis as any).Phaser ??= Phaser;

function makeChainableStub(): any {
  const stub: any = {
    handlers: {},
    modelPosition: { x: 0, y: 0, z: 0 },
    modelRotation: { x: 0, y: 0, z: 0 }
  };
  stub.on = jasmine.createSpy('on').and.callFake((event: string, callback: () => void) => {
    stub.handlers[event] = callback;
    return stub;
  });
  stub.destroy = jasmine.createSpy('destroy');
  [
    'setOrigin',
    'setDepth',
    'setAlpha',
    'setFontSize',
    'setFontFamily',
    'setColor',
    'setText',
    'setVisible',
    'setInteractive',
    'setFillStyle',
    'setMask',
    'setTint',
    'setTexture',
    'createBitmapMask'
  ].forEach(method => (stub[method] = jasmine.createSpy(method).and.returnValue(stub)));
  return stub;
}

function makeScene(created: { text: any[]; keys: any[] }): any {
  const createStub = (list: any[]) => () => {
    const stub = makeChainableStub();
    list.push(stub);
    return stub;
  };
  const socket = makeSocketStub();
  const scheduler: SchedulerService = {
    schedule: () => () => {}
  };
  const injector = createEnvironmentInjector(
    [
      { provide: SocketService, useValue: socket },
      { provide: SchedulerService, useValue: scheduler },
      GameSessionService,
      GameInteractionService
    ],
    TestBed.inject(EnvironmentInjector)
  );
  const session = injector.get(GameSessionService);
  const interaction = injector.get(GameInteractionService);
  const scene: any = {
    add: {
      rectangle: jasmine.createSpy('rectangle').and.callFake(createStub([])),
      text: jasmine.createSpy('text').and.callFake(createStub(created.text)),
      triangle: jasmine.createSpy('triangle').and.callFake(createStub([])),
      plane: jasmine.createSpy('plane').and.callFake(createStub([]))
    },
    input: {
      keyboard: {
        addKey: jasmine.createSpy('addKey').and.callFake(createStub(created.keys)),
        removeKey: jasmine.createSpy('removeKey')
      }
    },
    socket,
    session,
    interaction,
    obj: {},
    updateView: jasmine.createSpy('updateView')
  };
  interaction.viewChanged$.subscribe(() => scene.updateView());
  return scene;
}

/**
 * Stubs of the option card images: CardImage creates four planes per card (pile,
 * highlight, mask, image), of which only the image is interactive.
 */
function optionCardStubs(scene: any): any[] {
  return scene.add.plane.calls
    .all()
    .map((call: any) => call.returnValue)
    .filter((stub: any) => stub.setInteractive.calls.count() > 0);
}

describe('OptionPicker', () => {
  const handUUID = 'hand-1';
  const targetUUID = 'target-1';
  let scene: any;
  let picker: OptionPicker;
  let overlayStub: any;
  let textStubs: any[];
  let keyStubs: any[];

  beforeEach(() => {
    textStubs = [];
    keyStubs = [];
    scene = makeScene({ text: textStubs, keys: keyStubs });
    picker = new OptionPicker(scene, handUUID, targetUUID, [101, 102, 103], 2);
    overlayStub = scene.add.rectangle.calls.mostRecent().returnValue;
  });

  describe('registration', () => {
    it('registers itself as the pending option picker on the scene', () => {
      expect(scene.obj.optionPicker).toBe(picker);
    });

    it('renders option cards once when pendingOptionPicker$ triggers sync during construction', () => {
      picker.destroy();
      scene.interaction.cancelOptionPicker();
      scene.add.plane.calls.reset();
      const syncSpy = spyOn(OptionPicker.prototype, 'sync').and.callThrough();

      const sub = scene.interaction.pendingOptionPicker$.subscribe((state: unknown) => {
        if (state) {
          scene.obj.optionPicker?.sync();
        }
      });
      picker = new OptionPicker(scene, handUUID, targetUUID, [101, 102, 103], 2);
      sub.unsubscribe();

      expect(syncSpy).toHaveBeenCalledTimes(1);
      expect(optionCardStubs(scene).length).toBe(3);
    });
  });

  describe('confirm', () => {
    it('emits the hand card uuid captured at construction, not the current selection', () => {
      scene.interaction.activeCards.hand = undefined; // e.g. cleared by an interleaved state
      scene.interaction.toggleOptionPickerSelection(0);
      scene.interaction.toggleOptionPickerSelection(2);
      (picker as any).confirm();
      expect(scene.socket.emitHandcard).toHaveBeenCalledWith(handUUID, targetUUID, [101, 103]);
    });

    it('emits nothing unless all options are selected', () => {
      scene.interaction.toggleOptionPickerSelection(1);
      (picker as any).confirm();
      expect(scene.socket.emitHandcard).not.toHaveBeenCalled();
      expect(scene.obj.optionPicker).toBe(picker);
    });

    it('destroys the picker and clears the pending reference', () => {
      scene.interaction.toggleOptionPickerSelection(0);
      scene.interaction.toggleOptionPickerSelection(1);
      (picker as any).confirm();
      expect(scene.obj.optionPicker).toBeUndefined();
    });

    it('is wired to the OK button', () => {
      scene.interaction.toggleOptionPickerSelection(0);
      scene.interaction.toggleOptionPickerSelection(1);
      textStubs[2].handlers['pointerdown']({ leftButtonDown: () => true, rightButtonDown: () => false });
      expect(scene.socket.emitHandcard).toHaveBeenCalledWith(handUUID, targetUUID, [101, 102]);
    });

    it('cancels on right-clicking the OK button instead of confirming', () => {
      scene.interaction.toggleOptionPickerSelection(0);
      scene.interaction.toggleOptionPickerSelection(1);
      textStubs[2].handlers['pointerdown']({ leftButtonDown: () => false, rightButtonDown: () => true });
      expect(scene.socket.emitHandcard).not.toHaveBeenCalled();
      expect(scene.obj.optionPicker).toBeUndefined();
    });
  });

  describe('cancel', () => {
    it('emits nothing, destroys the picker and resets the selection state', () => {
      scene.interaction.activeCards.hand = handUUID;
      picker.cancel();
      expect(scene.socket.emitHandcard).not.toHaveBeenCalled();
      expect(scene.obj.optionPicker).toBeUndefined();
      expect(scene.interaction.activeCards.hand).toBeUndefined();
      expect(scene.updateView).toHaveBeenCalled();
    });

    it('is triggered by left-clicking the X button', () => {
      textStubs[1].handlers['pointerdown']({ leftButtonDown: () => true, rightButtonDown: () => false });
      expect(scene.obj.optionPicker).toBeUndefined();
      expect(scene.socket.emitHandcard).not.toHaveBeenCalled();
    });

    it('is triggered by pressing Escape', () => {
      keyStubs[0].handlers['down']();
      expect(scene.obj.optionPicker).toBeUndefined();
      expect(scene.socket.emitHandcard).not.toHaveBeenCalled();
    });

    it('is triggered by right-clicking the overlay', () => {
      overlayStub.handlers['pointerdown']({ rightButtonDown: () => true });
      expect(scene.obj.optionPicker).toBeUndefined();
      expect(scene.socket.emitHandcard).not.toHaveBeenCalled();
    });

    it('is triggered by right-clicking an option card', () => {
      optionCardStubs(scene)[0].handlers['pointerdown']({
        leftButtonDown: () => false,
        rightButtonDown: () => true
      });
      expect(scene.obj.optionPicker).toBeUndefined();
      expect(scene.socket.emitHandcard).not.toHaveBeenCalled();
    });

    it('is not triggered by left-clicking an option card', () => {
      optionCardStubs(scene)[0].handlers['pointerdown']({
        leftButtonDown: () => true,
        rightButtonDown: () => false
      });
      expect(scene.obj.optionPicker).toBe(picker);
      expect(scene.socket.emitHandcard).not.toHaveBeenCalled();
    });

    it('is not triggered by left-clicking the overlay', () => {
      overlayStub.handlers['pointerdown']({ leftButtonDown: () => true, rightButtonDown: () => false });
      expect(scene.obj.optionPicker).toBe(picker);
    });
  });

  describe('destroy', () => {
    it('removes the Escape key binding', () => {
      picker.destroy();
      expect(scene.input.keyboard.removeKey).toHaveBeenCalledWith(keyStubs[0], true, true);
    });
  });
});
