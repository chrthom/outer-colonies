import Game from '../scenes/game';
import ClientGameParams from '../../../../server/src/shared/interfaces/client_game_params';
import ClientPlannedBattle, {
  ClientPlannedBattleHelper
} from '../../../../server/src/shared/interfaces/client_planned_battle';
import { ClientState, emptyClientState } from '../../../../server/src/shared/interfaces/client_state';

/**
 * Shared Jasmine stubs for the Phaser scene API used by the client components.
 *
 * Every client spec renders its components against these stubs instead of
 * hand-rolling its own scene mocks. Game object stubs are chainable, so call
 * sequences like `scene.add.image(...).setOrigin(...).setDepth(...)` and
 * `scene.add.text(...).setFontSize(...).postFX.addShadow(...)` run through
 * without throwing.
 */

/** Game object methods that return the game object itself, so their stubs must be chainable. */
const chainableMethods = [
  'fillRect',
  'fillStyle',
  'on',
  'setAlign',
  'setAlpha',
  'setAngle',
  'setColor',
  'setDepth',
  'setFillStyle',
  'setFontFamily',
  'setFontSize',
  'setInteractive',
  'setMask',
  'setOrigin',
  'setScale',
  'setText',
  'setTexture',
  'setTint',
  'setVisible',
  'setX',
  'setXRotation',
  'setY',
  'setZ'
] as const;

export type ChainableMethod = (typeof chainableMethods)[number];

/** Stub of a Phaser game object (image, text, graphic, ...) with chainable setter spies. */
export type GameObjectStub = Record<ChainableMethod, jasmine.Spy> & {
  destroy: jasmine.Spy;
  postFX: { addGlow: jasmine.Spy; addShadow: jasmine.Spy; addShine: jasmine.Spy };
};

/**
 * Creates a chainable stub of a Phaser game object, e.g. one created via
 * `scene.add`. All chainable methods are spies returning the stub itself,
 * `destroy` is a plain spy and `postFX` holds the post effect spies.
 */
export function makeGameObjectStub(): GameObjectStub {
  const stub = {
    destroy: jasmine.createSpy('destroy'),
    postFX: {
      addGlow: jasmine.createSpy('addGlow'),
      addShadow: jasmine.createSpy('addShadow'),
      addShine: jasmine.createSpy('addShine')
    }
  } as GameObjectStub;
  chainableMethods.forEach(method => {
    stub[method] = jasmine.createSpy(method).and.returnValue(stub);
  });
  return stub;
}

/** Stub of the `scene.add` game object factory. */
export interface AddStub {
  graphics: jasmine.Spy;
  group: jasmine.Spy;
  image: jasmine.Spy;
  particles: jasmine.Spy;
  text: jasmine.Spy;
}

/** Creates a stub of the `scene.add` factory; every method returns a fresh game object stub. */
export function makeAddStub(): AddStub {
  return {
    graphics: jasmine.createSpy('add.graphics').and.callFake(makeGameObjectStub),
    group: jasmine.createSpy('add.group').and.callFake(makeGameObjectStub),
    image: jasmine.createSpy('add.image').and.callFake(makeGameObjectStub),
    particles: jasmine.createSpy('add.particles').and.callFake(makeGameObjectStub),
    text: jasmine.createSpy('add.text').and.callFake(makeGameObjectStub)
  };
}

/** Stub of the `scene.tweens` tween manager. */
export interface TweensStub {
  add: jasmine.Spy;
}

/** Creates a stub of the `scene.tweens` tween manager. */
export function makeTweensStub(): TweensStub {
  return { add: jasmine.createSpy('tweens.add') };
}

/** Stub of the `scene.time` clock. */
export interface TimeStub {
  delayedCall: jasmine.Spy;
}

/** Creates a stub of the `scene.time` clock. */
export function makeTimeStub(): TimeStub {
  return { delayedCall: jasmine.createSpy('time.delayedCall') };
}

/** Stub of the scene's fixed UI elements (`scene.obj`). */
export interface ObjStub {
  exitButton: { show: jasmine.Spy; hide: jasmine.Spy };
}

/** Creates a stub of the fixed UI elements with a spied exit button. */
export function makeObjStub(): ObjStub {
  return {
    exitButton: {
      show: jasmine.createSpy('exitButton.show'),
      hide: jasmine.createSpy('exitButton.hide')
    }
  };
}

/** Typed stub of the game scene the client components render on. */
export interface SceneStub {
  add: AddStub;
  getPlayerState: jasmine.Spy;
  getPlayerUI: jasmine.Spy;
  retractCardsExist: boolean;
  /**
   * Scene state; defaults to a deep copy of `emptyClientState` so no spec can
   * corrupt the shared constant. Pass `undefined` to mimic a scene without
   * state, e.g. the matchmaking scene.
   */
  state?: ClientState;
  time: TimeStub;
  tweens: TweensStub;
  /** The battle the player is planning; defaults to `ClientPlannedBattleHelper.empty` like the `Game` scene. */
  plannedBattle?: ClientPlannedBattle;
  /** Fixed UI elements; defaults to a fresh `makeObjStub()`. */
  obj?: ObjStub;
  /** Game parameters; only set on a game scene, so their absence mimics a matchmaking scene. */
  gameParams?: ClientGameParams;
}

/**
 * Creates a game scene stub. `getPlayerState` mirrors the real scene by
 * delegating to `state.player`/`state.opponent` and `getPlayerUI` returns an
 * empty hand; both spies can be re-stubbed per test via jasmine. The optional
 * overrides are applied to the returned stub itself, so the delegation always
 * reads the final state - also after later `scene.state = ...` assignments.
 */
export function makeSceneStub(overrides: Partial<SceneStub> = {}): SceneStub {
  const stub: SceneStub = {
    add: makeAddStub(),
    getPlayerState: jasmine.createSpy('getPlayerState'),
    getPlayerUI: jasmine.createSpy('getPlayerUI'),
    retractCardsExist: false,
    state: structuredClone(emptyClientState),
    time: makeTimeStub(),
    tweens: makeTweensStub(),
    plannedBattle: ClientPlannedBattleHelper.empty,
    obj: makeObjStub()
  };
  stub.getPlayerState.and.callFake((isPlayer: boolean) =>
    isPlayer ? stub.state?.player : stub.state?.opponent
  );
  stub.getPlayerUI.and.callFake(() => ({ hand: [] }));
  Object.assign(stub, overrides);
  return stub;
}

/**
 * Narrows a scene stub to the `Game` scene type expected by the client
 * components, keeping the stub's jasmine spies accessible for the spec.
 */
export function asGameScene(stub: SceneStub): Game {
  return stub as unknown as Game;
}
