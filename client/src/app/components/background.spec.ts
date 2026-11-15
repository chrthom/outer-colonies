import Background from './background';
import { TurnPhase } from '@shared/config/enums';
import { ClientState, emptyClientState } from '@shared/interfaces/client_state';
import { backgroundConfig } from '../config/background';
import { Coordinates, layoutConfig } from '../config/layout';

const chainableImage = (): any => {
  const stub: any = {};
  ['setOrigin', 'setDepth', 'setAlpha', 'setScale', 'setAngle', 'setTint'].forEach(
    method => (stub[method] = jasmine.createSpy(method).and.returnValue(stub))
  );
  return stub;
};

/**
 * Minimal scene stub. Without game properties it mimics a Matchmaking scene
 * (no `gameParams` and no `state`); with them it mimics a Game scene.
 */
const makeScene = (game?: { gameParams: object; state: ClientState }): any => {
  const scene: any = {
    add: {
      group: jasmine.createSpy('group').and.returnValue({}),
      image: jasmine.createSpy('image').and.callFake(chainableImage)
    },
    tweens: { add: jasmine.createSpy('tweens.add') },
    time: { delayedCall: jasmine.createSpy('delayedCall') }
  };
  if (game) {
    scene.gameParams = game.gameParams;
    scene.state = game.state;
  }
  return scene;
};

const makeGameScene = (turnPhase: TurnPhase): any =>
  makeScene({ gameParams: {}, state: { ...emptyClientState, turnPhase: turnPhase } });

describe('Background', () => {
  describe('outCoordinates', () => {
    it('moves out on the y axis based on the scene height', () => {
      const background = new Background(makeScene());
      // randomBoolean() false (x stays on screen), randomBoolean() true (positive off distance)
      spyOn(Math, 'random').and.returnValues(0.6, 0.4, 0.5);

      const c = (background as any).outCoordinates as Coordinates;

      expect(c.y).toBe(layoutConfig.scene.height + backgroundConfig.animation.offDistance);
      expect(c.x).toBe((0.5 - 0.25) * 2 * layoutConfig.scene.width);
    });

    it('moves out on the x axis based on the scene width', () => {
      const background = new Background(makeScene());
      // randomBoolean() true (x moves off screen), randomBoolean() true (positive off distance)
      spyOn(Math, 'random').and.returnValues(0.4, 0.4, 0.5);

      const c = (background as any).outCoordinates as Coordinates;

      expect(c.x).toBe(layoutConfig.scene.width + backgroundConfig.animation.offDistance);
      expect(c.y).toBe((0.5 - 0.25) * 2 * layoutConfig.scene.height);
    });
  });

  describe('inStartOrBuildPhase', () => {
    it('is safely false on a matchmaking scene', () => {
      const background = new Background(makeScene());

      expect((background as any).inStartOrBuildPhase).toBeFalse();
    });

    it('is true in the start phase of a game', () => {
      const background = new Background(makeGameScene(TurnPhase.Start));

      expect((background as any).inStartOrBuildPhase).toBeTrue();
    });

    it('is true in the build phase of a game', () => {
      const background = new Background(makeGameScene(TurnPhase.Build));

      expect((background as any).inStartOrBuildPhase).toBeTrue();
    });

    it('is false in other turn phases of a game', () => {
      const background = new Background(makeGameScene(TurnPhase.Combat));

      expect((background as any).inStartOrBuildPhase).toBeFalse();
    });
  });

  describe('update', () => {
    it('does not access game state on a matchmaking scene', () => {
      const scene = makeScene();
      let stateAccessed = false;
      Object.defineProperty(scene, 'state', {
        get: () => {
          stateAccessed = true;
          return undefined;
        }
      });
      const background = new Background(scene);

      expect(() => background.update()).not.toThrow();
      expect(stateAccessed).toBeFalse();
    });

    it('still starts the transition to the active player orb on a game scene', () => {
      const background = new Background(makeGameScene(TurnPhase.Start));

      background.update();

      expect((background as any).targetRing).toBeDefined();
    });
  });
});
