import { EnvironmentInjector, createEnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EventType, GameResultType, TurnPhase } from '@shared/config/enums';
import {
  ClientGameResult,
  ClientHandCard,
  ClientState,
  emptyClientState
} from '@shared/interfaces/client_state';
import Phaser from 'phaser';
import { GameInteractionService } from '../services/game_interaction_service';
import { GameSessionService } from '../services/game_session_service';
import { SchedulerService } from '../services/scheduler_service';
import { SERVICE_REGISTRY_KEYS } from '../services/service_registry';
import { SocketService } from '../socket_service';
import {
  makeAddStub,
  makeObjStub,
  makeSocketStub,
  makeTimeStub,
  makeTweensStub,
  ObjStub,
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

  game.session = session;
  game.interaction = interaction;
  game.add = makeAddStub() as unknown as Phaser.GameObjects.GameObjectFactory;
  game.time = makeTimeStub() as unknown as Phaser.Time.Clock;
  game.tweens = makeTweensStub() as unknown as Phaser.Tweens.TweenManager;

  const registryMap = new Map<string, unknown>([
    [SERVICE_REGISTRY_KEYS.gameSession, session],
    [SERVICE_REGISTRY_KEYS.gameInteraction, interaction]
  ]);
  (game as unknown as { registry: { get: (key: string) => unknown } }).registry = {
    get: (key: string) => registryMap.get(key)
  };

  const handles: GameTestHandles = { game, socket, scheduler, session, interaction };
  (game as unknown as { events: { once: jasmine.Spy } }).events = {
    once: jasmine.createSpy('events.once').and.callFake((event: string, handler: () => void) => {
      handles.shutdownEvent = event;
      handles.shutdownHandler = handler;
    })
  };
  return handles;
}

function expectSingleIndicator(game: Game) {
  expect(game.add.image as unknown as jasmine.Spy).toHaveBeenCalledTimes(1);
  expect(game.add.text as unknown as jasmine.Spy).toHaveBeenCalledTimes(3);
}

describe('Game scene - showConnectionLostMessage', () => {
  let handles: GameTestHandles;
  let game: Game;

  beforeEach(() => {
    handles = makeGameWithServices();
    game = handles.game;
  });

  it('renders a hint text when connection is lost without synthesizing a gameResult', () => {
    game.showConnectionLostMessage();

    expect(game.add.text as unknown as jasmine.Spy).toHaveBeenCalledTimes(1);
    expect(game.state.gameResult).toBeUndefined();
    expect(emptyClientState.gameResult).toBeUndefined();
  });

  it('is a no-op when a gameResult is already present', () => {
    const existing: ClientState = {
      ...emptyClientState,
      gameResult: { won: true, type: GameResultType.Domination, sol: 42 }
    };
    handles.session.applyState(existing);

    game.showConnectionLostMessage();

    expect(game.state).toBe(existing);
    expect(game.add.text as unknown as jasmine.Spy).not.toHaveBeenCalled();
  });

  it('renders the message exactly once on repeated calls', () => {
    game.showConnectionLostMessage();
    game.showConnectionLostMessage();

    expect(game.add.text as unknown as jasmine.Spy).toHaveBeenCalledTimes(1);
  });

  it('refreshes the exit button so it offers leaving instead of surrendering', () => {
    (game as unknown as { obj: ObjStub }).obj = makeObjStub();

    game.showConnectionLostMessage();

    expect(game.obj.exitButton.update).toHaveBeenCalled();
  });

  it('destroys a pending option picker, as no further state arrives while disconnected', () => {
    const optionPicker = { destroy: jasmine.createSpy('destroy') };
    (game as any).obj = { ...makeObjStub(), optionPicker };

    game.showConnectionLostMessage();

    expect(optionPicker.destroy).toHaveBeenCalled();
  });
});

describe('Game scene - service binding & lifecycle', () => {
  let handles: GameTestHandles;
  let game: Game;

  beforeEach(() => {
    handles = makeGameWithServices();
    game = handles.game;
    (game as any).preloader = { destroy: jasmine.createSpy('preloader.destroy') };
    (game as any).background = { update: jasmine.createSpy('background.update') };
    (game as any).player = {
      hand: [],
      actionPool: { update: jasmine.createSpy('player.actionPool') },
      countdownIndicator: { update: jasmine.createSpy('player.countdown') },
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
      actionPool: { update: jasmine.createSpy('opponent.actionPool') },
      countdownIndicator: { update: jasmine.createSpy('opponent.countdown') },
      deck: {
        update: jasmine.createSpy('opponent.deck'),
        highlightReset: jasmine.createSpy('opponent.deck.reset')
      },
      discardPile: {
        update: jasmine.createSpy('opponent.discardPile'),
        highlightReset: jasmine.createSpy('opponent.discardPile.reset')
      }
    };
    (game as any).obj = {
      ...makeObjStub(),
      continueButton: { update: jasmine.createSpy('continueButton.update') },
      combatRangeIndicator: { update: jasmine.createSpy('combatRangeIndicator.update') },
      zoomCard: { hide: jasmine.createSpy('zoomCard.hide') },
      raidButton: { updateVisibility: jasmine.createSpy('raidButton.updateVisibility') },
      missionButton: { updateVisibility: jasmine.createSpy('missionButton.updateVisibility') }
    };
    (game as any).bindServices();
    handles.session.startSession();
  });

  it('emits Ready(Init) on session start and binds SHUTDOWN cleanup', () => {
    expect(handles.socket.emitReady).toHaveBeenCalledWith(TurnPhase.Init);
    expect(handles.shutdownEvent).toBe(Phaser.Scenes.Events.SHUTDOWN);
  });

  it('renders connection lost message when socket disconnects via session service', () => {
    handles.socket.disconnect$.next();

    expect(game.connectionLost).toBeTrue();
    expect(game.add.text as unknown as jasmine.Spy).toHaveBeenCalledTimes(1);
  });

  it('updates countdown indicators from session countdown$', () => {
    handles.socket.countdown$.next({ countdown: 55, isPlayerActive: true });

    expect(game.player.countdownIndicator.update as unknown as jasmine.Spy).toHaveBeenCalledWith(55);
    expect(game.opponent.countdownIndicator.update as unknown as jasmine.Spy).toHaveBeenCalledWith(undefined);
  });

  it('destroys preloader and reconciles discard piles through the session pipeline', () => {
    const state: ClientState = {
      ...emptyClientState,
      turnPhase: TurnPhase.Build,
      player: { ...emptyClientState.player, discardPileIds: [7], hand: [] as ClientHandCard[] },
      opponent: { ...emptyClientState.opponent, discardPileIds: [8] }
    };

    handles.socket.state$.next(state);
    handles.scheduler.fireAll();

    expect(game.preloader.destroy as unknown as jasmine.Spy).toHaveBeenCalled();
    expect(game.player.discardPile.update as unknown as jasmine.Spy).toHaveBeenCalledWith([7]);
    expect(game.opponent.discardPile.update as unknown as jasmine.Spy).toHaveBeenCalledWith([8]);
  });

  it('stops session and unsubscribes scene listeners on SHUTDOWN', () => {
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

describe('Game scene - showGameOverIndicator', () => {
  let handles: GameTestHandles;
  let game: Game;

  beforeEach(() => {
    handles = makeGameWithServices();
    game = handles.game;
  });

  it('creates the overlay exactly once regardless of how often it is called', () => {
    const result: ClientGameResult = { won: true, type: GameResultType.Domination, sol: 42 };

    game.showGameOverIndicator(result);
    game.showGameOverIndicator(result);
    game.showGameOverIndicator({ ...result, sol: 0 });

    expectSingleIndicator(game);
  });

  it('does not create a second overlay when a game result follows a connection loss', () => {
    game.showConnectionLostMessage();
    handles.session.applyState({
      ...emptyClientState,
      gameResult: { won: false, type: GameResultType.Surrender, sol: 0 }
    });
    (game.add.text as unknown as jasmine.Spy).calls.reset();

    game.showGameOverIndicator(game.state.gameResult!);
    game.showGameOverIndicator(game.state.gameResult!);

    expectSingleIndicator(game);
  });

  it('shows a fresh overlay and resets connectionLost in the next match after init()', () => {
    game.showGameOverIndicator({ won: false, type: GameResultType.Surrender, sol: 0 });
    handles.session.handleDisconnect();
    expect(game.connectionLost).toBeTrue();

    game.init({ gameParams: { preloadCardIds: [] } });
    (game.add.image as unknown as jasmine.Spy).calls.reset();
    (game.add.text as unknown as jasmine.Spy).calls.reset();

    expect(game.connectionLost).toBeFalse();
    expect(handles.socket.disableReconnection).toHaveBeenCalled();

    game.showGameOverIndicator({ won: true, type: GameResultType.Domination, sol: 5 });
    expectSingleIndicator(game);
  });
});
