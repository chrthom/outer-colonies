import Background from './background';
import { TurnPhase } from '../../../../server/src/shared/config/enums';
import { emptyClientState } from '../../../../server/src/shared/interfaces/client_state';
import { backgroundConfig } from '../config/background';
import { Coordinates, layoutConfig } from '../config/layout';
import Game from '../scenes/game';
import Matchmaking from '../scenes/matchmaking';
import { makeSceneStub, SceneStub } from '../testing/phaser_stubs';

/** Narrows a scene stub to the scene union `Background` renders on. */
const asScene = (stub: SceneStub): Matchmaking | Game => stub as unknown as Matchmaking | Game;

/** Matchmaking-shaped scene: neither `gameParams` nor `state` are set. */
const makeMatchmakingScene = (): SceneStub => makeSceneStub({ state: undefined });

const makeGameScene = (turnPhase: TurnPhase): SceneStub =>
  makeSceneStub({
    gameParams: { preloadCardIds: [] },
    state: { ...emptyClientState, turnPhase: turnPhase }
  });

describe('Background', () => {
  describe('outCoordinates', () => {
    it('moves out on the y axis based on the scene height', () => {
      const background = new Background(asScene(makeMatchmakingScene()));
      // randomBoolean() false (x stays on screen), randomBoolean() true (positive off distance)
      spyOn(Math, 'random').and.returnValues(0.6, 0.4, 0.5);

      const c = (background as any).outCoordinates as Coordinates;

      expect(c.y).toBe(layoutConfig.scene.height + backgroundConfig.animation.offDistance);
      expect(c.x).toBe((0.5 - 0.25) * 2 * layoutConfig.scene.width);
    });

    it('moves out on the x axis based on the scene width', () => {
      const background = new Background(asScene(makeMatchmakingScene()));
      // randomBoolean() true (x moves off screen), randomBoolean() true (positive off distance)
      spyOn(Math, 'random').and.returnValues(0.4, 0.4, 0.5);

      const c = (background as any).outCoordinates as Coordinates;

      expect(c.x).toBe(layoutConfig.scene.width + backgroundConfig.animation.offDistance);
      expect(c.y).toBe((0.5 - 0.25) * 2 * layoutConfig.scene.height);
    });
  });

  describe('inStartOrBuildPhase', () => {
    it('is safely false on a matchmaking scene', () => {
      const background = new Background(asScene(makeMatchmakingScene()));

      expect((background as any).inStartOrBuildPhase).toBeFalse();
    });

    it('is true in the start phase of a game', () => {
      const background = new Background(asScene(makeGameScene(TurnPhase.Start)));

      expect((background as any).inStartOrBuildPhase).toBeTrue();
    });

    it('is true in the build phase of a game', () => {
      const background = new Background(asScene(makeGameScene(TurnPhase.Build)));

      expect((background as any).inStartOrBuildPhase).toBeTrue();
    });

    it('is false in other turn phases of a game', () => {
      const background = new Background(asScene(makeGameScene(TurnPhase.Combat)));

      expect((background as any).inStartOrBuildPhase).toBeFalse();
    });
  });

  describe('update', () => {
    it('does not access game state on a matchmaking scene', () => {
      const scene = makeMatchmakingScene();
      let stateAccessed = false;
      Object.defineProperty(scene, 'state', {
        get: () => {
          stateAccessed = true;
          return undefined;
        }
      });
      const background = new Background(asScene(scene));

      expect(() => background.update()).not.toThrow();
      expect(stateAccessed).toBeFalse();
    });

    it('still starts the transition to the active player orb on a game scene', () => {
      const background = new Background(asScene(makeGameScene(TurnPhase.Start)));

      background.update();

      expect((background as any).targetRing).toBeDefined();
    });
  });
});
