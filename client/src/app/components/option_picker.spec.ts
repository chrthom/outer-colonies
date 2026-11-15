import OptionPicker from './option_picker';
import { InterventionType, MsgTypeInbound, TurnPhase, Zone } from '@shared/config/enums';
import {
  ClientCardStack,
  ClientHandCard,
  ClientState,
  emptyClientState
} from '@shared/interfaces/client_state';
import Phaser from 'phaser';

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
  return {
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
    socket: { emit: jasmine.createSpy('emit') },
    obj: {},
    activeCards: {},
    state: emptyClientState,
    updateView: jasmine.createSpy('updateView')
  };
}

describe('OptionPicker', () => {
  const handUUID = 'hand-1';
  const targetUUID = 'target-1';
  const handCard: ClientHandCard = {
    uuid: handUUID,
    cardId: 101,
    index: 0,
    playable: true,
    validTargets: [targetUUID],
    ownedByPlayer: true,
    optionsToSelect: 2
  };
  const targetStack: ClientCardStack = {
    uuid: targetUUID,
    cards: [],
    zone: Zone.Colony,
    index: 0,
    zoneCardsNum: 1,
    ownedByPlayer: false,
    missionReady: false,
    interceptionReady: false,
    attributes: []
  };
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
  });

  describe('confirm', () => {
    it('emits the hand card uuid captured at construction, not the current scene selection', () => {
      scene.activeCards.hand = undefined; // e.g. cleared by an interleaved state
      (picker as any).selectedIndexes = [0, 2];
      (picker as any).confirm();
      expect(scene.socket.emit).toHaveBeenCalledWith(
        MsgTypeInbound.Handcard,
        handUUID,
        targetUUID,
        [101, 103]
      );
    });

    it('emits nothing unless all options are selected', () => {
      (picker as any).selectedIndexes = [1];
      (picker as any).confirm();
      expect(scene.socket.emit).not.toHaveBeenCalled();
      expect(scene.obj.optionPicker).toBe(picker);
    });

    it('destroys the picker and clears the pending reference', () => {
      (picker as any).selectedIndexes = [0, 1];
      (picker as any).confirm();
      expect(scene.obj.optionPicker).toBeUndefined();
    });

    it('is wired to the OK button', () => {
      (picker as any).selectedIndexes = [0, 1];
      textStubs[2].handlers['pointerdown']({ leftButtonDown: () => true });
      expect(scene.socket.emit).toHaveBeenCalledWith(
        MsgTypeInbound.Handcard,
        handUUID,
        targetUUID,
        [101, 102]
      );
    });
  });

  describe('cancel', () => {
    it('emits nothing, destroys the picker and resets the selection state', () => {
      scene.activeCards.hand = handUUID;
      picker.cancel();
      expect(scene.socket.emit).not.toHaveBeenCalled();
      expect(scene.obj.optionPicker).toBeUndefined();
      expect(scene.activeCards.hand).toBeUndefined();
      expect(scene.updateView).toHaveBeenCalled();
    });

    it('is triggered by left-clicking the X button', () => {
      textStubs[1].handlers['pointerdown']({ leftButtonDown: () => true });
      expect(scene.obj.optionPicker).toBeUndefined();
      expect(scene.socket.emit).not.toHaveBeenCalled();
    });

    it('is triggered by pressing Escape', () => {
      keyStubs[0].handlers['down']();
      expect(scene.obj.optionPicker).toBeUndefined();
      expect(scene.socket.emit).not.toHaveBeenCalled();
    });

    it('is triggered by right-clicking the overlay', () => {
      overlayStub.handlers['pointerdown']({ rightButtonDown: () => true });
      expect(scene.obj.optionPicker).toBeUndefined();
      expect(scene.socket.emit).not.toHaveBeenCalled();
    });

    it('is not triggered by left-clicking the overlay', () => {
      overlayStub.handlers['pointerdown']({ rightButtonDown: () => false });
      expect(scene.obj.optionPicker).toBe(picker);
    });
  });

  describe('destroy', () => {
    it('removes the Escape key binding', () => {
      picker.destroy();
      expect(scene.input.keyboard.removeKey).toHaveBeenCalledWith(keyStubs[0], true, true);
    });
  });

  describe('isValidFor', () => {
    function makeState(over: Partial<ClientState> = {}): ClientState {
      return {
        ...emptyClientState,
        playerIsActive: true,
        playerPendingAction: true,
        turnPhase: TurnPhase.Build,
        cardStacks: [targetStack],
        player: { ...emptyClientState.player, hand: [handCard] },
        ...over
      };
    }

    it('accepts a state in which the pending action is still possible', () => {
      expect(picker.isValidFor(makeState())).toBeTrue();
    });

    it('rejects a state without a pending player action', () => {
      expect(picker.isValidFor(makeState({ playerPendingAction: false }))).toBeFalse();
    });

    it('rejects a state in which the player is no longer active', () => {
      expect(picker.isValidFor(makeState({ playerIsActive: false }))).toBeFalse();
    });

    it('rejects a state outside the build phase', () => {
      expect(picker.isValidFor(makeState({ turnPhase: TurnPhase.Combat }))).toBeFalse();
    });

    it('rejects a state with an intervention', () => {
      expect(
        picker.isValidFor(
          makeState({
            intervention: { type: InterventionType.TacticCard, rootType: InterventionType.TacticCard }
          })
        )
      ).toBeFalse();
    });

    it('rejects a state in which the hand card is no longer in hand', () => {
      expect(picker.isValidFor(makeState({ player: { ...emptyClientState.player, hand: [] } }))).toBeFalse();
    });

    it('rejects a state in which the hand card is no longer playable', () => {
      const hand = [{ ...handCard, playable: false }];
      expect(picker.isValidFor(makeState({ player: { ...emptyClientState.player, hand } }))).toBeFalse();
    });

    it('rejects a state in which the target stack no longer exists', () => {
      expect(picker.isValidFor(makeState({ cardStacks: [] }))).toBeFalse();
    });

    it('rejects a state in which the target is no longer a valid target of the hand card', () => {
      const hand = [{ ...handCard, validTargets: ['other-target'] }];
      expect(picker.isValidFor(makeState({ player: { ...emptyClientState.player, hand } }))).toBeFalse();
    });
  });
});
