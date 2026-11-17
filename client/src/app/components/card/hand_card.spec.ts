import HandCard from './hand_card';
import { ClientHandCard, ClientState, emptyClientState } from '@shared/interfaces/client_state';
import { constants } from '@shared/config/constants';
import { asGameScene, makeGameObjectStub, makeSceneStub } from '../../testing/phaser_stubs';

// Extended with the model state the CardImage setters write to and the mask API setMask needs
function makePlaneStub() {
  return Object.assign(makeGameObjectStub(), {
    createBitmapMask: jasmine.createSpy('createBitmapMask').and.returnValue({}),
    modelPosition: { x: 0, y: 0, z: 0 },
    modelRotation: { x: 0, y: 0, z: 0 }
  });
}

function makeHandCardData(over: Partial<ClientHandCard> = {}): ClientHandCard {
  return {
    uuid: 'test-uuid',
    cardId: 1,
    index: 0,
    playable: false,
    validTargets: [],
    ownedByPlayer: true,
    optionsToSelect: 0,
    ...over
  };
}

function makeHandCard(state: ClientState, data: ClientHandCard): HandCard {
  const scene = makeSceneStub({ state: state });
  scene.add.plane.and.callFake(() => makePlaneStub());
  return new HandCard(asGameScene(scene), data);
}

describe('HandCard', () => {
  describe('maximizeTacticCard', () => {
    it('takes the revealed card ID from the state for redacted opponent cards', () => {
      const state = structuredClone(emptyClientState);
      state.highlightCardId = 123;
      const card = makeHandCard(
        state,
        makeHandCardData({ ownedByPlayer: false, cardId: constants.cardBackSideID })
      );
      spyOn(card, 'setCardId').and.callThrough();

      card.maximizeTacticCard();

      expect(card.setCardId).toHaveBeenCalledWith(123);
    });

    it('falls back to the hand card data ID when the state reveals none', () => {
      const state = structuredClone(emptyClientState);
      const card = makeHandCard(state, makeHandCardData({ cardId: 42 }));
      spyOn(card, 'setCardId').and.callThrough();

      card.maximizeTacticCard();

      expect(card.setCardId).toHaveBeenCalledWith(42);
    });
  });
});
