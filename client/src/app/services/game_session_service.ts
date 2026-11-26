import { Injectable, OnDestroy, inject } from '@angular/core';
import ClientGameParams from '@shared/interfaces/client_game_params';
import {
  ClientAttack,
  ClientEvent,
  ClientPlayer,
  ClientState,
  emptyClientState
} from '@shared/interfaces/client_state';
import { TurnPhase } from '@shared/config/enums';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { animationConfig } from '../config/animation';
import { SocketService } from '../socket_service';
import StateUpdateSequencer from '../utils/state_update_sequencer';
import { SchedulerService } from './scheduler_service';

/** Current countdown display state for player and opponent. */
export interface CountdownState {
  player?: number;
  opponent?: number;
}

/** Discard pile IDs emitted at the end of a state update sequence. */
export interface DiscardPilesUpdate {
  player: number[];
  opponent: number[];
}

/**
 * Renderer-agnostic service owning active match session state, socket subscriptions,
 * disconnect handling, countdown state, buffered card movement events, and the
 * cancel-and-replace state update pipeline.
 */
@Injectable({ providedIn: 'root' })
export class GameSessionService implements OnDestroy {
  private readonly stateSubject = new BehaviorSubject<ClientState>(emptyClientState);
  private readonly countdownSubject = new BehaviorSubject<CountdownState>({});
  private readonly connectionLostSubject = new BehaviorSubject<boolean>(false);
  private readonly isAttackAnimatingSubject = new BehaviorSubject<boolean>(false);

  private readonly stateReceivedSubject = new Subject<ClientState>();
  private readonly sessionStoppedSubject = new Subject<void>();
  private readonly attackAnimationSubject = new Subject<ClientAttack>();
  private readonly syncBoardStepSubject = new Subject<ClientState>();
  private readonly syncHandStepSubject = new Subject<ClientState>();
  private readonly syncViewStepSubject = new Subject<ClientState>();
  private readonly syncDiscardPilesStepSubject = new Subject<DiscardPilesUpdate>();

  /** Authoritative client game state (updated immediately upon arrival). */
  readonly state$: Observable<ClientState> = this.stateSubject.asObservable();
  /** Turn countdown values for player and opponent. */
  readonly countdown$: Observable<CountdownState> = this.countdownSubject.asObservable();
  /** Whether the match socket disconnected mid-game before a game result arrived. */
  readonly connectionLost$: Observable<boolean> = this.connectionLostSubject.asObservable();
  /** Whether an attack animation window is currently active. */
  readonly isAttackAnimating$: Observable<boolean> = this.isAttackAnimatingSubject.asObservable();

  /** Emits synchronously when a new state arrives, before sequenced animation steps start. */
  readonly stateReceived$: Observable<ClientState> = this.stateReceivedSubject.asObservable();
  /** Emits whenever the active match session is stopped or left. */
  readonly sessionStopped$: Observable<void> = this.sessionStoppedSubject.asObservable();
  /** Emits when an incoming state carries a recent attack to animate. */
  readonly attackAnimation$: Observable<ClientAttack> = this.attackAnimationSubject.asObservable();
  /** Sequencer step 1: reconcile board card stacks. */
  readonly syncBoardStep$: Observable<ClientState> = this.syncBoardStepSubject.asObservable();
  /** Sequencer step 2a: reconcile hand cards while buffered movement events are still available. */
  readonly syncHandStep$: Observable<ClientState> = this.syncHandStepSubject.asObservable();
  /** Sequencer step 2b: refresh view/highlighting/auto-ready after buffered events are cleared. */
  readonly syncViewStep$: Observable<ClientState> = this.syncViewStepSubject.asObservable();
  /** Sequencer step 3: update discard pile counts/top cards after card move animations settle. */
  readonly syncDiscardPilesStep$: Observable<DiscardPilesUpdate> =
    this.syncDiscardPilesStepSubject.asObservable();

  /** Game startup parameters for the current match, if initialized. */
  gameParams?: ClientGameParams;
  /** Flag set by board reconciliation when a retract animation delays hand reconciliation. */
  retractCardsExist = false;

  private readonly socketService = inject(SocketService);
  private readonly scheduler = inject(SchedulerService);

  private readonly stateUpdateSequencer: StateUpdateSequencer;
  private readonly pendingCardMovementEvents = new Map<string, ClientEvent>();
  private subscriptions?: Subscription;
  private cancelAttackTimer?: () => void;

  constructor() {
    this.stateUpdateSequencer = new StateUpdateSequencer((delayMs, callback) =>
      this.scheduler.schedule(delayMs, callback)
    );
  }

  /** Latest client state. */
  get state(): ClientState {
    return this.stateSubject.value;
  }

  /** Current countdown values. */
  get countdown(): CountdownState {
    return this.countdownSubject.value;
  }

  /** Whether a mid-game disconnect was detected before game over. */
  get connectionLost(): boolean {
    return this.connectionLostSubject.value;
  }

  /** Whether an attack animation is currently playing. */
  get isAttackAnimating(): boolean {
    return this.isAttackAnimatingSubject.value;
  }

  /**
   * Initializes session state for a new match and disables automatic Socket.IO
   * reconnection (mid-game rejoins happen via page reload).
   *
   * @param gameParams Startup parameters received from matchmaking.
   */
  initMatch(gameParams: ClientGameParams): void {
    this.stopSession();
    this.gameParams = gameParams;
    this.socketService.disableReconnection();
    this.stateSubject.next(emptyClientState);
    this.connectionLostSubject.next(false);
    this.countdownSubject.next({});
    this.isAttackAnimatingSubject.next(false);
    this.retractCardsExist = false;
    this.pendingCardMovementEvents.clear();
  }

  /**
   * Subscribes to inbound match streams and notifies the server that the client
   * is ready to receive the initial state.
   */
  startSession(): void {
    this.subscriptions?.unsubscribe();
    const sub = new Subscription();
    sub.add(this.socketService.state$.subscribe(state => this.applyState(state)));
    sub.add(
      this.socketService.countdown$.subscribe(({ countdown, isPlayerActive }) => {
        this.countdownSubject.next(
          isPlayerActive
            ? { player: countdown, opponent: undefined }
            : { player: undefined, opponent: countdown }
        );
      })
    );
    sub.add(this.socketService.disconnect$.subscribe(() => this.handleDisconnect()));
    this.subscriptions = sub;
    this.socketService.emitReady(TurnPhase.Init);
  }

  /**
   * Unsubscribes match socket listeners and cancels any pending sequencer or attack timers.
   */
  stopSession(): void {
    this.subscriptions?.unsubscribe();
    this.subscriptions = undefined;
    this.stateUpdateSequencer.cancel();
    this.cancelAttackTimer?.();
    this.cancelAttackTimer = undefined;
    this.isAttackAnimatingSubject.next(false);
    this.sessionStoppedSubject.next();
  }

  /**
   * Stops the active match session and disconnects the socket connection.
   */
  leaveMatch(): void {
    this.stopSession();
    this.socketService.disconnect();
  }

  /**
   * Applies an incoming game state through the cancel-and-replace update pipeline.
   *
   * `this.state` is updated immediately as the single source of truth, while
   * animation/reconciliation steps are sequenced so superseded runs leave only
   * the newest state to reconcile.
   */
  applyState(state: ClientState): void {
    for (const event of state.events) {
      if (event.oldUUID) {
        this.pendingCardMovementEvents.set(event.oldUUID, event);
      }
    }
    this.stateSubject.next(state);
    this.stateReceivedSubject.next(state);

    const attack = state.battle.recentAttack;
    const attackAnimating = !!attack;
    if (attack) {
      this.cancelAttackTimer?.();
      this.isAttackAnimatingSubject.next(true);
      this.attackAnimationSubject.next(attack);
      this.cancelAttackTimer = this.scheduler.schedule(animationConfig.duration.attack, () => {
        this.cancelAttackTimer = undefined;
        this.isAttackAnimatingSubject.next(false);
      });
    }

    this.stateUpdateSequencer.run([
      {
        delay: () => (attackAnimating ? animationConfig.duration.attack : 0),
        action: () => {
          this.retractCardsExist = false;
          this.syncBoardStepSubject.next(state);
        }
      },
      {
        delay: () => (this.retractCardsExist ? animationConfig.duration.move : 0),
        action: () => {
          this.syncHandStepSubject.next(state);
          this.pendingCardMovementEvents.clear();
          this.syncViewStepSubject.next(state);
        }
      },
      {
        delay: () => animationConfig.duration.move,
        action: () => {
          this.syncDiscardPilesStepSubject.next({
            player: state.player.discardPileIds,
            opponent: state.opponent.discardPileIds
          });
        }
      }
    ]);
  }

  /**
   * Marks the match connection as lost when a disconnect occurs before game over.
   */
  handleDisconnect(): void {
    if (this.connectionLost || this.state.gameResult) return;
    this.connectionLostSubject.next(true);
  }

  /**
   * Returns the player or opponent slice of the current state.
   */
  getPlayerState(isPlayer: boolean): ClientPlayer {
    return isPlayer ? this.state.player : this.state.opponent;
  }

  /**
   * Returns the server-reported card movement event (retract or discard) for the
   * given card UUID, including events buffered from superseded intermediate states.
   */
  getCardMovementEvent(cardUUID: string): ClientEvent | undefined {
    return this.pendingCardMovementEvents.get(cardUUID) ?? this.state.events.find(e => e.oldUUID == cardUUID);
  }

  /**
   * Signals that at least one card retract animation started during board reconciliation,
   * delaying the subsequent hand update step.
   */
  markRetractCardsExist(): void {
    this.retractCardsExist = true;
  }

  ngOnDestroy(): void {
    this.stopSession();
  }
}
