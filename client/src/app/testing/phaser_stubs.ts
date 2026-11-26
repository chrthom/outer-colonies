import { EnvironmentInjector, createEnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import ClientGameParams from '@shared/interfaces/client_game_params';
import { ClientState, emptyClientState } from '@shared/interfaces/client_state';
import { Subject } from 'rxjs';
import Game from '../scenes/game';
import { GameInteractionService } from '../services/game_interaction_service';
import { GameSessionService } from '../services/game_session_service';
import { SchedulerService } from '../services/scheduler_service';
import { CountdownEvent, SocketService } from '../socket_service';

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
  'clear',
  'disableInteractive',
  'fillRect',
  'fillStyle',
  'off',
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

/** Stub of a Phaser group as created by `scene.add.group()`. */
export type GroupStub = GameObjectStub & {
  add: jasmine.Spy;
  addMultiple: jasmine.Spy;
};

/**
 * Creates a chainable stub of a Phaser group: a game object stub whose
 * `add`/`addMultiple` spies return the group itself, like Phaser's group API.
 */
export function makeGroupStub(): GroupStub {
  const stub = {
    add: jasmine.createSpy('group.add'),
    addMultiple: jasmine.createSpy('group.addMultiple')
  } as GroupStub;
  Object.assign(stub, makeGameObjectStub());
  stub.add.and.returnValue(stub);
  stub.addMultiple.and.returnValue(stub);
  return stub;
}

/** Stub of the `scene.add` game object factory. */
export interface AddStub {
  graphics: jasmine.Spy;
  group: jasmine.Spy;
  image: jasmine.Spy;
  line: jasmine.Spy;
  particles: jasmine.Spy;
  plane: jasmine.Spy;
  rectangle: jasmine.Spy;
  text: jasmine.Spy;
}

/**
 * Creates a stub of the `scene.add` factory; every method returns a fresh game
 * object stub, and `group` returns a fresh group-shaped stub.
 */
export function makeAddStub(): AddStub {
  return {
    graphics: jasmine.createSpy('add.graphics').and.callFake(makeGameObjectStub),
    group: jasmine.createSpy('add.group').and.callFake(makeGroupStub),
    image: jasmine.createSpy('add.image').and.callFake(makeGameObjectStub),
    line: jasmine.createSpy('add.line').and.callFake(makeGameObjectStub),
    particles: jasmine.createSpy('add.particles').and.callFake(makeGameObjectStub),
    plane: jasmine.createSpy('add.plane').and.callFake(makeGameObjectStub),
    rectangle: jasmine.createSpy('add.rectangle').and.callFake(makeGameObjectStub),
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

/** Stub of a `Phaser.Time.TimerEvent` as returned by `scene.time.delayedCall`. */
export interface TimerEventStub {
  /** Whether `scene.time.removeEvent` was called for this timer event. */
  removed: boolean;
}

/** Stub of the `scene.time` clock. */
export interface TimeStub {
  delayedCall: jasmine.Spy;
  removeEvent: jasmine.Spy;
}

/**
 * Creates a stub of the `scene.time` clock. `delayedCall` records a timer
 * event whose `removed` flag `removeEvent` sets, mirroring Phaser's
 * cancel-timer semantics.
 */
export function makeTimeStub(): TimeStub {
  return {
    delayedCall: jasmine
      .createSpy('time.delayedCall')
      .and.callFake((): TimerEventStub => ({ removed: false })),
    removeEvent: jasmine.createSpy('time.removeEvent').and.callFake((timerEvent: TimerEventStub) => {
      timerEvent.removed = true;
    })
  };
}

/** Stub of the scene's fixed UI elements (`scene.obj`). */
export interface ObjStub {
  exitButton: { show: jasmine.Spy; hide: jasmine.Spy; update: jasmine.Spy };
}

/** Creates a stub of the fixed UI elements with a spied exit button. */
export function makeObjStub(): ObjStub {
  return {
    exitButton: {
      show: jasmine.createSpy('exitButton.show'),
      hide: jasmine.createSpy('exitButton.hide'),
      update: jasmine.createSpy('exitButton.update')
    }
  };
}

/** Stub of the `SocketService` used by scene stubs and service-backed component specs. */
export interface SocketStub {
  state$: Subject<ClientState>;
  countdown$: Subject<CountdownEvent>;
  disconnect$: Subject<void>;
  disableReconnection: jasmine.Spy;
  disconnect: jasmine.Spy;
  emitReady: jasmine.Spy;
  emitHandcard: jasmine.Spy;
  emitDiscard: jasmine.Spy;
  emitAttack: jasmine.Spy;
  emitRetract: jasmine.Spy;
  emitSurrender: jasmine.Spy;
}

/** Creates a stub of `SocketService` with typed inbound subjects and outbound spies. */
export function makeSocketStub(): SocketStub {
  return {
    state$: new Subject<ClientState>(),
    countdown$: new Subject<CountdownEvent>(),
    disconnect$: new Subject<void>(),
    disableReconnection: jasmine.createSpy('socketService.disableReconnection'),
    disconnect: jasmine.createSpy('socketService.disconnect'),
    emitReady: jasmine.createSpy('socketService.emitReady'),
    emitHandcard: jasmine.createSpy('socketService.emitHandcard'),
    emitDiscard: jasmine.createSpy('socketService.emitDiscard'),
    emitAttack: jasmine.createSpy('socketService.emitAttack'),
    emitRetract: jasmine.createSpy('socketService.emitRetract'),
    emitSurrender: jasmine.createSpy('socketService.emitSurrender')
  };
}

/** Stub of the `scene.input` plugin. */
export interface InputStub {
  /** Keyboard plugin; `undefined` mimics a scene without keyboard bindings. */
  keyboard?: { addKey: jasmine.Spy };
}

/** Creates a stub of the `scene.input` plugin without keyboard bindings. */
export function makeInputStub(): InputStub {
  return { keyboard: undefined };
}

/** Stub of the `scene.load` loader. */
export interface LoadStub {
  on: jasmine.Spy;
}

/** Creates a stub of the `scene.load` loader whose `on` spy returns the stub itself. */
export function makeLoadStub(): LoadStub {
  const stub: LoadStub = { on: jasmine.createSpy('load.on') };
  stub.on.and.returnValue(stub);
  return stub;
}

/** Typed stub of the game scene the client components render on. */
export interface SceneStub {
  add: AddStub;
  getPlayerState: jasmine.Spy;
  getPlayerUI: jasmine.Spy;
  /**
   * Scene state; defaults to a deep copy of `emptyClientState` so no spec can
   * corrupt the shared constant. Pass `undefined` to mimic a scene without
   * state, e.g. the matchmaking scene.
   */
  state?: ClientState;
  time: TimeStub;
  tweens: TweensStub;
  /** Fixed UI elements; defaults to a fresh `makeObjStub()`. */
  obj?: ObjStub;
  /** Game parameters; only set on a game scene, so their absence mimics a matchmaking scene. */
  gameParams?: ClientGameParams;
  /** The `SocketService` stub backing `session` and `interaction`. */
  socket: SocketStub;
  /** Real `GameSessionService` wired to `socket` and `time`. */
  session: GameSessionService;
  /** Real `GameInteractionService` wired to `session`, `socket`, and `time`. */
  interaction: GameInteractionService;
  /** The input plugin; defaults to a stub without keyboard bindings. */
  input: InputStub;
  /** The resource loader; defaults to a fresh `makeLoadStub()`. */
  load: LoadStub;
}

/**
 * Creates a game scene stub backed by `GameSessionService` and `GameInteractionService`.
 * `getPlayerState` mirrors the real scene by delegating to `session.getPlayerState`,
 * and `getPlayerUI` returns an empty hand; both spies can be re-stubbed per test via jasmine.
 */
export function makeSceneStub(overrides: Partial<SceneStub> = {}): SceneStub {
  const time = overrides.time ?? makeTimeStub();
  const socket = overrides.socket ?? makeSocketStub();
  const scheduler: SchedulerService = {
    schedule: (delayMs: number, callback: () => void) => {
      const event = time.delayedCall(delayMs, callback);
      return () => {
        if (event !== undefined) {
          time.removeEvent(event);
        }
      };
    }
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
  const session = overrides.session ?? injector.get(GameSessionService);
  const interaction = overrides.interaction ?? injector.get(GameInteractionService);

  const hasExplicitUndefinedState = 'state' in overrides && overrides.state === undefined;
  let stateUndefined = hasExplicitUndefinedState;
  if (!hasExplicitUndefinedState) {
    const initialState = overrides.state ?? structuredClone(emptyClientState);
    (session as unknown as { stateSubject: { next: (s: ClientState) => void } }).stateSubject.next(
      initialState
    );
  }

  const stub: SceneStub = {
    add: makeAddStub(),
    getPlayerState: jasmine.createSpy('getPlayerState'),
    getPlayerUI: jasmine.createSpy('getPlayerUI'),
    time,
    tweens: makeTweensStub(),
    obj: makeObjStub(),
    socket,
    session,
    interaction,
    input: makeInputStub(),
    load: makeLoadStub()
  };

  const restOverrides = { ...overrides };
  delete restOverrides.state;
  Object.assign(stub, restOverrides);

  Object.defineProperty(stub, 'state', {
    configurable: true,
    enumerable: true,
    get: () => (stateUndefined ? undefined : session.state),
    set: (nextState: ClientState | undefined) => {
      if (nextState === undefined) {
        stateUndefined = true;
      } else {
        stateUndefined = false;
        (session as unknown as { stateSubject: { next: (s: ClientState) => void } }).stateSubject.next(
          nextState
        );
      }
    }
  });

  stub.getPlayerState.and.callFake((isPlayer: boolean) => session.getPlayerState(isPlayer));
  stub.getPlayerUI.and.callFake(() => ({ hand: [] }));
  return stub;
}

/**
 * Narrows a scene stub to the `Game` scene type expected by the client
 * components, keeping the stub's jasmine spies accessible for the spec.
 */
export function asGameScene(stub: SceneStub): Game {
  return stub as unknown as Game;
}
