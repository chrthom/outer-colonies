import { EnvironmentInjector, createEnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EventType, TurnPhase } from '@shared/config/enums';
import { ClientHandCard, ClientState, emptyClientState } from '@shared/interfaces/client_state';
import Phaser from 'phaser';
import { AssetPreloaderService } from '../services/asset_preloader_service';
import { GameInteractionService } from '../services/game_interaction_service';
import { GameSessionService } from '../services/game_session_service';
import { SchedulerService } from '../services/scheduler_service';
import { SERVICE_REGISTRY_KEYS } from '../services/service_registry';
import { SocketService } from '../socket_service';
import {
  makeAddStub,
  makeGameObjectStub,
  makeSocketStub,
  makeTimeStub,
  makeTweensStub,
  SocketStub
} from '../testing/phaser_stubs';
import Game from './game';

class FakeScheduler implements SchedulerService {
  readonly entries: Array<{ delay: number; callback: () => void; cancelled: boolean }> = [];

  schedule = (delay: number, callback: () => void): (() => void) => {
    const entry = { delay, callback, cancelled: false };
    this.entries.push(entry);
    return () => {
      entry.cancelled = true;
    };
  };

  fireAll(): void {
    while (this.entries.some(e => !e.cancelled)) {
      const entry = this.entries.shift()!;
      if (!entry.cancelled) {
        entry.callback();
      }
    }
  }
}

interface GameTestHandles {
  game: Game;
  socket: SocketStub;
  scheduler: FakeScheduler;
  session: GameSessionService;
  interaction: GameInteractionService;
  assetPreloader: {
    preloadMatch: jasmine.Spy;
    registerPhaserTextures: jasmine.Spy;
  };
  sceneManager: { start: jasmine.Spy };
  shutdownEvent?: string;
  shutdownHandler?: () => void;
}

function makeGameWithServices(): GameTestHandles {
  const game = new Game();
  const socket = makeSocketStub();
  const scheduler = new FakeScheduler();
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
  const assetPreloader = {
    preloadMatch: jasmine.createSpy('preloadMatch').and.resolveTo(),
    registerPhaserTextures: jasmine.createSpy('registerPhaserTextures')
  };

  game.session = session;
  game.interaction = interaction;
  game.assetPreloader = assetPreloader as unknown as AssetPreloaderService;
  game.add = makeAddStub() as unknown as Phaser.GameObjects.GameObjectFactory;
  game.time = makeTimeStub() as unknown as Phaser.Time.Clock;
  game.tweens = makeTweensStub() as unknown as Phaser.Tweens.TweenManager;
  (game as unknown as { textures: object }).textures = {};

  const sceneManager = { start: jasmine.createSpy('scene.start') };
  (game as unknown as { scene: { start: jasmine.Spy } }).scene = sceneManager;

  const registryMap = new Map<string, unknown>([
    [SERVICE_REGISTRY_KEYS.gameSession, session],
    [SERVICE_REGISTRY_KEYS.gameInteraction, interaction],
    [SERVICE_REGISTRY_KEYS.assetPreloader, assetPreloader]
  ]);
  (game as unknown as { registry: { get: (key: string) => unknown } }).registry = {
    get: (key: string) => registryMap.get(key)
  };

  const handles: GameTestHandles = {
    game,
    socket,
    scheduler,
    session,
    interaction,
    assetPreloader,
    sceneManager
  };
  (game as unknown as { events: { once: jasmine.Spy } }).events = {
    once: jasmine.createSpy('events.once').and.callFake((event: string, handler: () => void) => {
      handles.shutdownEvent = event;
      handles.shutdownHandler = handler;
    })
  };
  return handles;
}

describe('Game scene - board adapter & lifecycle', () => {
  let handles: GameTestHandles;
  let game: Game;

  beforeEach(() => {
    handles = makeGameWithServices();
    game = handles.game;
    (game as any).background = { update: jasmine.createSpy('background.update') };
    (game as any).player = {
      hand: [],
      deck: {
        update: jasmine.createSpy('player.deck'),
        highlightReset: jasmine.createSpy('player.deck.reset')
      },
      discardPile: {
        update: jasmine.createSpy('player.discardPile'),
        highlightReset: jasmine.createSpy('player.discardPile.reset')
      }
    };
    (game as any).opponent = {
      hand: [],
      deck: {
        update: jasmine.createSpy('opponent.deck'),
        highlightReset: jasmine.createSpy('opponent.deck.reset')
      },
      discardPile: {
        update: jasmine.createSpy('opponent.discardPile'),
        highlightReset: jasmine.createSpy('opponent.discardPile.reset')
      }
    };
    (game as any).bindServices();
    handles.session.startSession();
  });

  it('emits Ready(Init) on session start', () => {
    expect(handles.socket.emitReady).toHaveBeenCalledWith(TurnPhase.Init);
  });

  it('reconciles deck and discard piles through the session pipeline', () => {
    const state: ClientState = {
      ...emptyClientState,
      turnPhase: TurnPhase.Build,
      player: { ...emptyClientState.player, discardPileIds: [7], hand: [] as ClientHandCard[] },
      opponent: { ...emptyClientState.opponent, discardPileIds: [8] }
    };

    handles.socket.state$.next(state);
    handles.scheduler.fireAll();

    expect(game.player.discardPile.update as unknown as jasmine.Spy).toHaveBeenCalledWith([7]);
    expect(game.opponent.discardPile.update as unknown as jasmine.Spy).toHaveBeenCalledWith([8]);
    expect(game.player.deck.update as unknown as jasmine.Spy).toHaveBeenCalled();
    expect(game.opponent.deck.update as unknown as jasmine.Spy).toHaveBeenCalled();
  });

  it('switches to Matchmaking scene when returnToMatchmaking$ emits', () => {
    handles.session.applyState({
      ...emptyClientState,
      gameResult: { won: true, sol: 10 }
    });

    handles.interaction.continueAction();

    expect(handles.sceneManager.start).toHaveBeenCalledWith('Matchmaking');
  });

  it('preloads match assets and registers textures before starting session in create()', async () => {
    game.init({ gameParams: { preloadCardIds: [11, 22] } });
    (game.add.plane as unknown as jasmine.Spy).and.callFake(() =>
      Object.assign(makeGameObjectStub(), {
        createBitmapMask: jasmine.createSpy('createBitmapMask').and.returnValue({}),
        modelPosition: { x: 0, y: 0, z: 0 },
        modelRotation: { x: 0, y: 0, z: 0 }
      })
    );
    (game.add as unknown as { ellipse: jasmine.Spy }).ellipse = jasmine
      .createSpy('add.ellipse')
      .and.callFake(makeGameObjectStub);

    game.create();
    expect(handles.shutdownEvent).toBe(Phaser.Scenes.Events.SHUTDOWN);

    await handles.assetPreloader.preloadMatch.calls.mostRecent().returnValue;

    expect(handles.assetPreloader.preloadMatch).toHaveBeenCalledWith([11, 22]);
    expect(handles.assetPreloader.registerPhaserTextures).toHaveBeenCalled();
    expect(handles.socket.emitReady).toHaveBeenCalledWith(TurnPhase.Init);
  });

  it('stops session and unsubscribes scene listeners on SHUTDOWN', () => {
    game.init({ gameParams: { preloadCardIds: [] } });
    game.create();

    handles.shutdownHandler!();
    handles.socket.disconnect$.next();

    expect(game.connectionLost).toBeFalse();
  });
});

describe('Game scene - getCardMovementEvent', () => {
  it('delegates to GameSessionService.getCardMovementEvent', () => {
    const handles = makeGameWithServices();
    handles.session.applyState({
      ...emptyClientState,
      events: [
        { type: EventType.Retract, playerEvent: true, oldUUID: 'card-1', newUUID: 'hand-1' },
        { type: EventType.Discard, playerEvent: false, oldUUID: 'card-2' }
      ]
    });

    expect(handles.game.getCardMovementEvent('card-1')?.type).toBe(EventType.Retract);
    expect(handles.game.getCardMovementEvent('card-2')?.type).toBe(EventType.Discard);
    expect(handles.game.getCardMovementEvent('card-3')).toBeUndefined();
  });
});
