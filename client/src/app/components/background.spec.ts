import Background from './background';
import { TurnPhase } from '@shared/config/enums';
import { ClientState, emptyClientState } from '@shared/interfaces/client_state';
import { backgroundConfig } from '../config/background';
import { Coordinates, layoutConfig } from '../config/layout';
import Game from '../scenes/game';

interface ChainableImageStub {
  setOrigin: jasmine.Spy;
  setDepth: jasmine.Spy;
  setAlpha: jasmine.Spy;
  setScale: jasmine.Spy;
  setAngle: jasmine.Spy;
  setTint: jasmine.Spy;
}

const chainableImage = (): ChainableImageStub => {
  const stub = {} as ChainableImageStub;
  (
    ['setOrigin', 'setDepth', 'setAlpha', 'setScale', 'setAngle', 'setTint'] as Array<
      keyof ChainableImageStub
    >
  ).forEach(method => (stub[method] = jasmine.createSpy(method).and.returnValue(stub)));
  return stub;
};

/**
 * Minimal scene stub. Without game properties it mimics a Matchmaking scene
 * (no `gameParams` and no `state`); with them it mimics a Game scene.
 */
interface SceneStub {
  add: { group: jasmine.Spy; image: jasmine.Spy };
  tweens: { add: jasmine.Spy };
  time: { delayedCall: jasmine.Spy };
  gameParams?: object;
  state?: ClientState;
}

const makeScene = (game?: { gameParams: object; state: ClientState }): SceneStub => {
  const scene: SceneStub = {
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

const makeGameScene = (turnPhase: TurnPhase): SceneStub =>
  makeScene({ gameParams: {}, state: { ...emptyClientState, turnPhase: turnPhase } });

const asGame = (scene: SceneStub): Game => scene as unknown as Game;

describe('Background', () => {
  describe('outCoordinates', () => {
    it('moves out on the y axis based on the scene height', () => {
      const background = new Background(asGame(makeScene()));
      // randomBoolean() false (x stays on screen), randomBoolean() true (positive off distance)
      spyOn(Math, 'random').and.returnValues(0.6, 0.4, 0.5);

      const c = (background as unknown as { outCoordinates: Coordinates }).outCoordinates;

      expect(c.y).toBe(layoutConfig.scene.height + backgroundConfig.animation.offDistance);
      expect(c.x).toBe((0.5 - 0.25) * 2 * layoutConfig.scene.width);
    });

    it('moves out on the x axis based on the scene width', () => {
      const background = new Background(asGame(makeScene()));
      // randomBoolean() true (x moves off screen), randomBoolean() true (positive off distance)
      spyOn(Math, 'random').and.returnValues(0.4, 0.4, 0.5);

      const c = (background as unknown as { outCoordinates: Coordinates }).outCoordinates;

      expect(c.x).toBe(layoutConfig.scene.width + backgroundConfig.animation.offDistance);
      expect(c.y).toBe((0.5 - 0.25) * 2 * layoutConfig.scene.height);
    });
  });

  describe('inStartOrBuildPhase', () => {
    it('is safely false on a matchmaking scene', () => {
      const background = new Background(asGame(makeScene()));

      expect((background as unknown as { inStartOrBuildPhase: boolean }).inStartOrBuildPhase).toBeFalse();
    });

    it('is true in the start phase of a game', () => {
      const background = new Background(asGame(makeGameScene(TurnPhase.Start)));

      expect((background as unknown as { inStartOrBuildPhase: boolean }).inStartOrBuildPhase).toBeTrue();
    });

    it('is true in the build phase of a game', () => {
      const background = new Background(asGame(makeGameScene(TurnPhase.Build)));

      expect((background as unknown as { inStartOrBuildPhase: boolean }).inStartOrBuildPhase).toBeTrue();
    });

    it('is false in other turn phases of a game', () => {
      const background = new Background(asGame(makeGameScene(TurnPhase.Combat)));

      expect((background as unknown as { inStartOrBuildPhase: boolean }).inStartOrBuildPhase).toBeFalse();
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
      const background = new Background(asGame(scene));

      expect(() => background.update()).not.toThrow();
      expect(stateAccessed).toBeFalse();
    });

    it('still starts the transition to the active player orb on a game scene', () => {
      const background = new Background(asGame(makeGameScene(TurnPhase.Start)));

      background.update();

      expect((background as unknown as { targetRing?: number }).targetRing).toBeDefined();
    });
  });
});
