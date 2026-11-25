import { TestBed } from '@angular/core/testing';
import { constants } from '@shared/config/constants';
import { BattleType, GameResultType, InterventionType, TurnPhase, Zone } from '@shared/config/enums';
import { rules } from '@shared/config/rules';
import {
  ClientCard,
  ClientCardStack,
  ClientHandCard,
  ClientState,
  emptyClientState
} from '@shared/interfaces/client_state';
import { Subject } from 'rxjs';
import { animationConfig } from '../config/animation';
import { CountdownEvent, SocketService } from '../socket_service';
import { GameInteractionService } from './game_interaction_service';
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

  activeDelays(): number[] {
    return this.entries.filter(e => !e.cancelled).map(e => e.delay);
  }

  fireNext(): void {
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
      this.fireNext();
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
  emitHandcard = jasmine.createSpy('emitHandcard');
  emitDiscard = jasmine.createSpy('emitDiscard');
  emitAttack = jasmine.createSpy('emitAttack');
  emitRetract = jasmine.createSpy('emitRetract');
  emitSurrender = jasmine.createSpy('emitSurrender');
}

function makeHandCard(uuid: string, over: Partial<ClientHandCard> = {}): ClientHandCard {
  return {
    uuid,
    cardId: 10,
    index: 0,
    playable: true,
    validTargets: [],
    ownedByPlayer: true,
    optionsToSelect: 0,
    ...over
  };
}

function makeCard(uuid: string, over: Partial<ClientCard> = {}): ClientCard {
  return {
    uuid,
    id: 20,
    index: 0,
    battleReady: false,
    retractable: false,
    insufficientEnergy: false,
    ...over
  };
}

function makeStack(uuid: string, over: Partial<ClientCardStack> = {}): ClientCardStack {
  return {
    uuid,
    zone: Zone.Colony,
    cards: [makeCard(`${uuid}-hull`)],
    index: 0,
    zoneCardsNum: 1,
    ownedByPlayer: true,
    missionReady: false,
    interceptionReady: false,
    attributes: [],
    ...over
  };
}

function makeState(over: Partial<ClientState> = {}): ClientState {
  return { ...emptyClientState, ...over };
}

describe('GameInteractionService', () => {
  let service: GameInteractionService;
  let session: GameSessionService;
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
    session = TestBed.inject(GameSessionService);
    service = TestBed.inject(GameInteractionService);
  });

  afterEach(() => {
    session.stopSession();
  });

  describe('hand card & board card play', () => {
    it('selects and deselects a playable hand card and highlights valid targets', () => {
      const hand = makeHandCard('hand-1', { validTargets: ['stack-1'] });
      const targetStack = makeStack('stack-1');
      const otherStack = makeStack('stack-2');
      session.applyState(
        makeState({
          playerPendingAction: true,
          playerIsActive: true,
          turnPhase: TurnPhase.Build,
          player: { ...emptyClientState.player, hand: [hand] },
          cardStacks: [targetStack, otherStack]
        })
      );

      service.clickHandCard('hand-1');
      expect(service.activeCards.hand).toBe('hand-1');
      expect(service.getHandCardHighlight(hand)).toBe('selected');
      expect(service.getCardStackHighlight(targetStack).stackHighlight).toBe('selectable');
      expect(service.getCardStackHighlight(otherStack).stackHighlight).toBe('none');

      service.clickHandCard('hand-1');
      expect(service.activeCards.hand).toBeUndefined();
      expect(service.getHandCardHighlight(hand)).toBe('selectable');
    });

    it('emits Handcard when clicking a target stack with a hand card selected', () => {
      const hand = makeHandCard('hand-1', { validTargets: ['stack-1'] });
      session.applyState(
        makeState({
          playerPendingAction: true,
          playerIsActive: true,
          turnPhase: TurnPhase.Build,
          player: { ...emptyClientState.player, hand: [hand] },
          cardStacks: [makeStack('stack-1')]
        })
      );

      service.clickHandCard('hand-1');
      service.clickCardStack('stack-1');

      expect(socketService.emitHandcard).toHaveBeenCalledWith('hand-1', 'stack-1');
    });

    it('emits Discard when clicking a hand card in the end phase', () => {
      const hand = makeHandCard('hand-1', { playable: false });
      session.applyState(
        makeState({
          playerPendingAction: true,
          playerIsActive: true,
          turnPhase: TurnPhase.End,
          player: { ...emptyClientState.player, hand: [hand] }
        })
      );

      service.clickHandCard('hand-1');

      expect(socketService.emitDiscard).toHaveBeenCalledWith('hand-1');
    });

    it('plays a hand card during an intervention onto the clicked stack', () => {
      const hand = makeHandCard('tactic-1', { validTargets: ['stack-1'] });
      session.applyState(
        makeState({
          playerPendingAction: true,
          playerIsActive: false,
          turnPhase: TurnPhase.Combat,
          intervention: { type: InterventionType.Attack, rootType: InterventionType.Attack },
          player: { ...emptyClientState.player, hand: [hand] },
          cardStacks: [makeStack('stack-1')]
        })
      );

      service.clickHandCard('tactic-1');
      service.clickCardStack('stack-1');

      expect(socketService.emitHandcard).toHaveBeenCalledWith('tactic-1', 'stack-1');
    });
  });

  describe('option picker flow', () => {
    function setupOptionCardState(over: Partial<ClientState> = {}) {
      const hand = makeHandCard('hand-opt', {
        validTargets: ['target-1'],
        options: [101, 102, 103, 104],
        optionsToSelect: 2
      });
      const target = makeStack('target-1', { ownedByPlayer: false });
      session.applyState(
        makeState({
          playerPendingAction: true,
          playerIsActive: true,
          turnPhase: TurnPhase.Build,
          player: { ...emptyClientState.player, hand: [hand] },
          cardStacks: [target],
          ...over
        })
      );
      return { hand, target };
    }

    it('opens the option picker instead of emitting immediately when options exist', () => {
      setupOptionCardState();

      service.clickHandCard('hand-opt');
      service.clickCardStack('target-1');

      expect(socketService.emitHandcard).not.toHaveBeenCalled();
      const vm = service.getOptionPickerViewModel();
      expect(vm).toBeDefined();
      expect(vm!.maxPage).toBe(2);
      expect(vm!.hasPreviousPage).toBeFalse();
      expect(vm!.hasNextPage).toBeTrue();
      expect(vm!.visibleOptions.map(o => o.cardId)).toEqual([101, 102, 103]);
      expect(vm!.selectedOptionsText).toBe('0/2 Karten ausgewählt - zeige Seite 1/2');
    });

    it('supports pagination, option toggling, and emits captured UUIDs on confirm', () => {
      setupOptionCardState();
      service.clickHandCard('hand-opt');
      service.clickCardStack('target-1');

      service.toggleOptionPickerSelection(0);
      expect(service.confirmOptionPicker()).toBeFalse();
      expect(socketService.emitHandcard).not.toHaveBeenCalled();

      service.moveOptionPickerPage(1);
      expect(service.getOptionPickerViewModel()!.visibleOptions.map(o => o.cardId)).toEqual([104]);
      service.toggleOptionPickerSelection(3);

      // Interleaved state clears activeCards.hand while keeping valid picker open
      setupOptionCardState();
      expect(service.activeCards.hand).toBeUndefined();
      expect(service.pendingOptionPicker).toBeDefined();

      expect(service.confirmOptionPicker()).toBeTrue();
      expect(service.pendingOptionPicker).toBeUndefined();
      expect(socketService.emitHandcard).toHaveBeenCalledWith('hand-opt', 'target-1', [101, 104]);
    });

    it('cancels without emitting and clears activeCards.hand', () => {
      setupOptionCardState();
      service.clickHandCard('hand-opt');
      service.clickCardStack('target-1');

      service.cancelOptionPicker();

      expect(service.pendingOptionPicker).toBeUndefined();
      expect(service.activeCards.hand).toBeUndefined();
      expect(socketService.emitHandcard).not.toHaveBeenCalled();
    });

    it('closes a pending option picker when an incoming state invalidates it or connection is lost', () => {
      setupOptionCardState();
      service.clickHandCard('hand-opt');
      service.clickCardStack('target-1');
      expect(service.pendingOptionPicker).toBeDefined();

      // Invalidated by combat phase
      setupOptionCardState({ turnPhase: TurnPhase.Combat });
      expect(service.pendingOptionPicker).toBeUndefined();

      // Re-open and disconnect
      setupOptionCardState();
      service.clickHandCard('hand-opt');
      service.clickCardStack('target-1');
      expect(service.pendingOptionPicker).toBeDefined();

      session.handleDisconnect();
      expect(service.pendingOptionPicker).toBeUndefined();
    });
  });

  describe('battle planning & interception', () => {
    it('toggles planned mission/raid, selects ships, and emits Ready(Build, plannedBattle)', () => {
      const ship = makeStack('ship-1', { missionReady: true });
      session.applyState(
        makeState({
          playerPendingAction: true,
          playerIsActive: true,
          turnPhase: TurnPhase.Build,
          cardStacks: [ship]
        })
      );

      expect(service.canShowBattleActionButtons()).toBeTrue();
      service.togglePlannedBattle(BattleType.Mission);
      expect(service.plannedBattle.type).toBe(BattleType.Mission);
      expect(service.getCardStackHighlight(ship).stackHighlight).toBe('selectable');

      service.clickCardStack('ship-1');
      expect(service.plannedBattle.shipIds).toEqual(['ship-1']);
      expect(service.getCardStackHighlight(ship).stackHighlight).toBe('selected');
      expect(service.getContinueButtonState().text).toBe('Mission durchführen');

      service.continueAction();
      expect(socketService.emitReady).toHaveBeenCalledWith(TurnPhase.Build, {
        type: BattleType.Mission,
        shipIds: ['ship-1']
      });
    });

    it('toggles interception ships for the inactive defender and emits Ready(Build, interceptShipIds)', () => {
      const interceptor = makeStack('int-1', { missionReady: true, interceptionReady: true });
      session.applyState(
        makeState({
          playerPendingAction: true,
          playerIsActive: false,
          turnPhase: TurnPhase.Build,
          battle: { type: BattleType.Mission, playerShipIds: [], opponentShipIds: ['opp-1'], range: 3 },
          cardStacks: [interceptor]
        })
      );

      service.clickCardStack('int-1');
      expect(service.interceptShipIds).toEqual(['int-1']);
      expect(service.getCardStackHighlight(interceptor).stackHighlight).toBe('selected');
      expect(service.getContinueButtonState().text).toBe('Abfangen');

      service.continueAction();
      expect(socketService.emitReady).toHaveBeenCalledWith(TurnPhase.Build, ['int-1']);
    });
  });

  describe('combat & attacks', () => {
    it('selects weapon cards, targets opponent ships, and supports all-out colony attack at range 1', () => {
      const weapon = makeCard('weapon-1', { battleReady: true });
      const playerShip = makeStack('p-ship', { cards: [weapon] });
      const oppColony = makeStack('opp-colony', {
        ownedByPlayer: false,
        cards: [makeCard('col-card', { id: constants.colonyID })]
      });
      const oppShip = makeStack('opp-ship', { ownedByPlayer: false });

      session.applyState(
        makeState({
          playerPendingAction: true,
          playerIsActive: true,
          turnPhase: TurnPhase.Combat,
          battle: {
            type: BattleType.Raid,
            playerShipIds: ['p-ship'],
            opponentShipIds: ['opp-colony', 'opp-ship'],
            range: 1
          },
          cardStacks: [playerShip, oppColony, oppShip]
        })
      );

      // Before selecting a weapon, opponent colony at range 1 is highlighted as selected for all-attack
      expect(service.canPerformAllAttackOnBase(oppColony)).toBeTrue();
      expect(service.getCardStackHighlight(oppColony).stackHighlight).toBe('selected');

      // Select weapon -> target opponent ship
      service.clickCardStack('p-ship', 'weapon-1');
      expect(service.activeCards).toEqual({ stackUUID: 'p-ship', cardUUID: 'weapon-1', hand: undefined });
      expect(service.getCardStackHighlight(playerShip).cardHighlights.get('weapon-1')).toBe('selected');
      expect(service.getCardStackHighlight(oppShip).stackHighlight).toBe('selectable');

      service.clickCardStack('opp-ship');
      expect(socketService.emitAttack).toHaveBeenCalledWith('p-ship', 'weapon-1', 'opp-ship');

      // Deselect weapon -> click opponent colony for all-attack
      service.clickCardStack('p-ship', 'weapon-1');
      service.clickCardStack('opp-colony');
      expect(socketService.emitAttack).toHaveBeenCalledWith(
        constants.attackAllID,
        constants.attackAllID,
        'opp-colony'
      );
    });
  });

  describe('auto-ready scheduling', () => {
    function combatState(over: Partial<ClientState> = {}): ClientState {
      return makeState({
        playerPendingAction: true,
        playerIsActive: false,
        turnPhase: TurnPhase.Combat,
        battle: {
          type: BattleType.Raid,
          playerShipIds: [],
          opponentShipIds: ['opp-ship'],
          range: 2
        },
        ...over
      });
    }

    it('schedules and fires auto-ready once per state when unable to attack', () => {
      session.applyState(combatState());
      scheduler.fireAll();

      expect(socketService.emitReady).toHaveBeenCalledTimes(1);
      expect(socketService.emitReady).toHaveBeenCalledWith(TurnPhase.Combat);

      // Calling syncAutoReady again for the same state does not re-queue
      service.syncAutoReady();
      scheduler.fireAll();
      expect(socketService.emitReady).toHaveBeenCalledTimes(1);
    });

    it('cancels queued auto-ready when the player acts manually and does not re-queue for the same state', () => {
      session.applyState(combatState());
      scheduler.fireNext(); // Board step
      scheduler.fireNext(); // Hand + view step -> queues auto-ready
      expect(scheduler.activeDelays()).toContain(animationConfig.duration.attack);

      service.continueAction();
      expect(socketService.emitReady).toHaveBeenCalledTimes(1);
      expect(scheduler.activeDelays()).not.toContain(animationConfig.duration.attack);

      service.syncAutoReady();
      scheduler.fireAll();
      expect(socketService.emitReady).toHaveBeenCalledTimes(1);
    });

    it('schedules auto-ready in build phase when inactive defender has no interception-ready ships', () => {
      session.applyState(
        makeState({
          playerPendingAction: true,
          playerIsActive: false,
          turnPhase: TurnPhase.Build
        })
      );
      scheduler.fireAll();

      expect(socketService.emitReady).toHaveBeenCalledWith(TurnPhase.Build, []);
    });
  });

  describe('derived view-models & direct intents', () => {
    it('computes prompt, combat range, exit button, retract, surrender, and game-over states', () => {
      session.applyState(
        makeState({
          playerPendingAction: true,
          turnPhase: TurnPhase.Combat,
          battle: { type: BattleType.Mission, playerShipIds: [], opponentShipIds: [], range: 3 }
        })
      );

      expect(service.getPromptState().text).toBe(
        'Aktuelle Reichweite des Gefechts: 3\nFühre Angriffe mit deinen\nWaffensystemen durch!'
      );
      expect(service.getVisibleCombatRange()).toBe(3);
      expect(service.getExitButtonState()).toEqual({ label: 'Aufgeben', canSurrender: true });

      service.retractCard('stack-1', 'card-1');
      expect(socketService.emitRetract).toHaveBeenCalledWith('stack-1', 'card-1');

      service.surrender();
      expect(socketService.emitSurrender).toHaveBeenCalledTimes(1);

      session.applyState(
        makeState({
          battle: {
            type: BattleType.Mission,
            playerShipIds: [],
            opponentShipIds: [],
            range: rules.maxRange + 1
          },
          gameResult: { won: true, type: GameResultType.Domination, sol: 50 }
        })
      );

      expect(service.getVisibleCombatRange()).toBeUndefined();
      expect(service.getPromptState().isGameOver).toBeTrue();
      expect(service.getContinueButtonState()).toEqual({
        text: 'Neuen Gegner suchen',
        buttonKey: 'won',
        enabled: true,
        isGameOver: true
      });
      expect(service.continueAction()).toBe('matchmaking');
      expect(service.getExitButtonState()).toEqual({ label: 'Spiel beenden', canSurrender: false });
    });
  });
});
