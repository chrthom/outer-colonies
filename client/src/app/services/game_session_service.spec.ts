import { TestBed } from '@angular/core/testing';
import { EventType, GameResultType, TurnPhase } from '@shared/config/enums';
import { ClientHandCard, ClientState, emptyClientState } from '@shared/interfaces/client_state';
import { Subject } from 'rxjs';
import { animationConfig } from '../config/animation';
import { CountdownEvent, SocketService } from '../socket_service';
import { GameSessionService } from './game_session_service';
import { SchedulerService } from './scheduler_service';

class FakeScheduler {
  readonly entries: Array<{ delay: number; callback: () => void; cancelled: boolean }> = [];

  schedule = (delay: number, callback: () => void): (() => void) => {
    const entry = { delay, callback, cancelled: false };
    this.entries.push(entry);
    return () => {
      entry.cancelled = true;
    };
  };

  fireOldest(): void {
    while (this.entries.length) {
      const entry = this.entries.shift()!;
      if (!entry.cancelled) {
        entry.callback();
        return;
      }
    }
    throw new Error('No active timer scheduled');
  }

  fireAll(): void {
    while (this.entries.some(e => !e.cancelled)) {
      this.fireOldest();
    }
  }
}

class MockSocketService {
  readonly state$ = new Subject<ClientState>();
  readonly countdown$ = new Subject<CountdownEvent>();
  readonly disconnect$ = new Subject<void>();

  disableReconnection = jasmine.createSpy('disableReconnection');
  disconnect = jasmine.createSpy('disconnect');
  emitReady = jasmine.createSpy('emitReady');
}

function handCard(uuid: string, cardId = 1): ClientHandCard {
  return {
    uuid,
    cardId,
    index: 0,
    playable: true,
    validTargets: [],
    ownedByPlayer: true,
    optionsToSelect: 0
  };
}

function makeState(over: Partial<ClientState> = {}): ClientState {
  return { ...emptyClientState, ...over };
}

describe('GameSessionService', () => {
  let service: GameSessionService;
  let socketService: MockSocketService;
  let scheduler: FakeScheduler;

  beforeEach(() => {
    socketService = new MockSocketService();
    scheduler = new FakeScheduler();
    TestBed.configureTestingModule({
      providers: [
        { provide: SocketService, useValue: socketService },
        { provide: SchedulerService, useValue: scheduler }
      ]
    });
    service = TestBed.inject(GameSessionService);
  });

  afterEach(() => {
    service.stopSession();
  });

  describe('session lifecycle & socket handling', () => {
    it('disables socket auto-reconnection and resets session state on initMatch()', () => {
      service.applyState(makeState({ turnPhase: TurnPhase.Combat }));
      service.handleDisconnect();
      expect(service.connectionLost).toBeTrue();

      service.initMatch({ preloadCardIds: [1, 2] });

      expect(socketService.disableReconnection).toHaveBeenCalledTimes(1);
      expect(service.gameParams).toEqual({ preloadCardIds: [1, 2] });
      expect(service.state).toBe(emptyClientState);
      expect(service.connectionLost).toBeFalse();
      expect(service.countdown).toEqual({});
      expect(service.isAttackAnimating).toBeFalse();
    });

    it('subscribes to match streams and emits Ready(Init) on startSession()', () => {
      service.initMatch({ preloadCardIds: [] });
      service.startSession();

      expect(socketService.emitReady).toHaveBeenCalledWith(TurnPhase.Init);

      const state = makeState({ turnPhase: TurnPhase.Build });
      socketService.state$.next(state);
      expect(service.state).toBe(state);

      socketService.countdown$.next({ countdown: 45, isPlayerActive: true });
      expect(service.countdown).toEqual({ player: 45, opponent: undefined });

      socketService.countdown$.next({ countdown: 30, isPlayerActive: false });
      expect(service.countdown).toEqual({ player: undefined, opponent: 30 });
    });

    it('removes socket listeners and cancels timers on stopSession()', () => {
      service.initMatch({ preloadCardIds: [] });
      service.startSession();
      const boardSpy = jasmine.createSpy('boardStep');
      const sub = service.syncBoardStep$.subscribe(boardSpy);

      socketService.state$.next(makeState({ turnPhase: TurnPhase.Build }));
      service.stopSession();

      socketService.state$.next(makeState({ turnPhase: TurnPhase.Combat }));
      socketService.countdown$.next({ countdown: 10, isPlayerActive: true });
      socketService.disconnect$.next();

      expect(service.state.turnPhase).toBe(TurnPhase.Build);
      expect(service.countdown).toEqual({});
      expect(service.connectionLost).toBeFalse();
      expect(scheduler.entries.every(e => e.cancelled)).toBeTrue();
      expect(boardSpy).not.toHaveBeenCalled();
      sub.unsubscribe();
    });

    it('stops session and disconnects socket on leaveMatch()', () => {
      service.initMatch({ preloadCardIds: [] });
      service.startSession();

      service.leaveMatch();

      expect(socketService.disconnect).toHaveBeenCalledTimes(1);
      socketService.disconnect$.next();
      expect(service.connectionLost).toBeFalse();
    });
  });

  describe('disconnect handling', () => {
    it('marks connectionLost on disconnect without synthesizing a gameResult', () => {
      service.handleDisconnect();

      expect(service.connectionLost).toBeTrue();
      expect(service.state.gameResult).toBeUndefined();
      expect(emptyClientState.gameResult).toBeUndefined();
    });

    it('ignores disconnects when a gameResult is already present', () => {
      service.applyState(
        makeState({
          gameResult: { won: true, type: GameResultType.Domination, sol: 42 }
        })
      );

      service.handleDisconnect();

      expect(service.connectionLost).toBeFalse();
    });
  });

  describe('state update pipeline', () => {
    it('runs the full update chain for a single state', () => {
      const steps: string[] = [];
      let discardUpdate: unknown;
      const sub = service.syncBoardStep$.subscribe(() => steps.push('board'));
      sub.add(service.syncHandStep$.subscribe(() => steps.push('hand')));
      sub.add(service.syncViewStep$.subscribe(() => steps.push('view')));
      sub.add(
        service.syncDiscardPilesStep$.subscribe(piles => {
          steps.push('discard');
          discardUpdate = piles;
        })
      );

      const state = makeState({
        turnPhase: TurnPhase.Build,
        player: { ...emptyClientState.player, discardPileIds: [7], hand: [handCard('p1', 10)] },
        opponent: { ...emptyClientState.opponent, discardPileIds: [8] }
      });

      service.applyState(state);
      scheduler.fireAll();

      expect(steps).toEqual(['board', 'hand', 'view', 'discard']);
      expect(discardUpdate).toEqual({ player: [7], opponent: [8] });
      sub.unsubscribe();
    });

    it('reconciles to the newest state when a second state arrives mid-chain', () => {
      const boardStates: TurnPhase[] = [];
      const handStates: TurnPhase[] = [];
      let discardUpdate: unknown;
      const sub = service.syncBoardStep$.subscribe(s => boardStates.push(s.turnPhase));
      sub.add(service.syncHandStep$.subscribe(s => handStates.push(s.turnPhase)));
      sub.add(service.syncDiscardPilesStep$.subscribe(piles => (discardUpdate = piles)));

      service.applyState(makeState({ turnPhase: TurnPhase.Build }));
      scheduler.fireOldest(); // Chain 1 runs board step

      const state2 = makeState({
        turnPhase: TurnPhase.Combat,
        player: { ...emptyClientState.player, discardPileIds: [3] },
        opponent: { ...emptyClientState.opponent, discardPileIds: [4] }
      });
      service.applyState(state2);
      scheduler.fireAll();

      expect(service.state).toBe(state2);
      expect(boardStates).toEqual([TurnPhase.Build, TurnPhase.Combat]);
      expect(handStates).toEqual([TurnPhase.Combat]);
      expect(discardUpdate).toEqual({ player: [3], opponent: [4] });
      sub.unsubscribe();
    });

    it('waits for attack animation duration before running the board step', () => {
      const boardSpy = jasmine.createSpy('board');
      const attackSpy = jasmine.createSpy('attack');
      const sub = service.syncBoardStep$.subscribe(boardSpy);
      sub.add(service.attackAnimation$.subscribe(attackSpy));

      const recentAttack = {
        sourceRootUUID: 'src-root',
        sourceSubUUID: 'src-sub',
        targetUUID: 'target',
        pointDefense: 0,
        shield: 0,
        armour: 0,
        damage: 1
      };
      service.applyState(
        makeState({
          battle: { ...emptyClientState.battle, recentAttack }
        })
      );

      expect(service.isAttackAnimating).toBeTrue();
      expect(attackSpy).toHaveBeenCalledWith(recentAttack);
      expect(scheduler.entries.map(e => e.delay)).toEqual([
        animationConfig.duration.attack,
        animationConfig.duration.attack
      ]);

      scheduler.fireOldest(); // Attack animation ends
      expect(service.isAttackAnimating).toBeFalse();
      expect(boardSpy).not.toHaveBeenCalled();

      scheduler.fireOldest(); // Board step runs
      expect(boardSpy).toHaveBeenCalledTimes(1);
      sub.unsubscribe();
    });

    it('delays hand reconciliation when markRetractCardsExist() was called during board reconciliation', () => {
      const handSpy = jasmine.createSpy('hand');
      const sub = service.syncBoardStep$.subscribe(() => service.markRetractCardsExist());
      sub.add(service.syncHandStep$.subscribe(handSpy));

      service.applyState(makeState());
      scheduler.fireOldest(); // Step 1 marks retract

      const activeDelays = scheduler.entries.filter(e => !e.cancelled).map(e => e.delay);
      expect(activeDelays).toEqual([animationConfig.duration.move]);
      expect(handSpy).not.toHaveBeenCalled();

      scheduler.fireOldest();
      expect(handSpy).toHaveBeenCalledTimes(1);
      sub.unsubscribe();
    });

    it('retains buffered movement events from superseded states until hand reconciliation completes', () => {
      let seenDuringBoard: EventType | undefined;
      let seenDuringHand: EventType | undefined;
      let seenDuringView: EventType | undefined;
      const sub = service.syncBoardStep$.subscribe(() => {
        seenDuringBoard = service.getCardMovementEvent('ship-1')?.type;
      });
      sub.add(
        service.syncHandStep$.subscribe(() => {
          seenDuringHand = service.getCardMovementEvent('hand-1')?.type;
        })
      );
      sub.add(
        service.syncViewStep$.subscribe(() => {
          seenDuringView = service.getCardMovementEvent('hand-1')?.type;
        })
      );

      service.applyState(
        makeState({
          events: [
            { type: EventType.Retract, playerEvent: true, oldUUID: 'ship-1', newUUID: 'hand-2' },
            { type: EventType.Discard, playerEvent: true, oldUUID: 'hand-1' }
          ]
        })
      );
      service.applyState(makeState({ events: [] }));
      scheduler.fireAll();

      expect(seenDuringBoard).toBe(EventType.Retract);
      expect(seenDuringHand).toBe(EventType.Discard);
      expect(seenDuringView).toBeUndefined();
      expect(service.getCardMovementEvent('ship-1')).toBeUndefined();
      expect(service.getCardMovementEvent('hand-1')).toBeUndefined();
      sub.unsubscribe();
    });
  });

  describe('getPlayerState', () => {
    it('returns player or opponent state slice', () => {
      const state = makeState({
        player: { ...emptyClientState.player, name: 'Apollo' },
        opponent: { ...emptyClientState.opponent, name: 'Zeus' }
      });
      service.applyState(state);

      expect(service.getPlayerState(true).name).toBe('Apollo');
      expect(service.getPlayerState(false).name).toBe('Zeus');
    });
  });
});
