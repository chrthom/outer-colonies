import { Server } from 'socket.io';
import Match, { MatchBot } from '../game_state/match';
import { EventType, TurnPhase } from '../../shared/config/enums';
import { ClientState } from '../../shared/interfaces/client_state';
import { onAttack, onDiscard, onHandCard, onReady, onRetract } from '../game';
import {
  planBattle,
  selectAttack,
  selectCardOptions,
  selectHandCard,
  selectInterceptingShips,
  selectRetractableCard,
  selectTarget
} from './strategy';

/**
 * Scheduler used by the bot to pace its actions like a fast human player so
 * the client can animate each incoming state update one by one. Injected so
 * unit tests can drive bot reactions deterministically without real timers.
 */
export interface BotScheduler {
  schedule(delayMs: number, callback: () => void): unknown;
  cancel(handle: unknown): void;
}

export const defaultBotReactionDelays = {
  normal: 700,
  tactic: 900,
  retract: 1000,
  attack: 1200
};

const defaultScheduler: BotScheduler = {
  schedule: (delayMs, callback) => setTimeout(callback, delayMs),
  cancel: handle => clearTimeout(handle as ReturnType<typeof setTimeout>)
};

/**
 * Server-side pseudo player for singleplayer games. The bot receives the exact
 * same outbound events as a human client (match start and projected
 * `ClientState`) and sends every action through the same `game.ts` handlers
 * (`onReady`, `onHandCard`, `onRetract`, `onDiscard`, `onAttack`), paced so
 * each step animates cleanly on the opponent's client.
 */
export default class Bot implements MatchBot {
  readonly match: Match;
  readonly playerNo: number;
  private readonly scheduler: BotScheduler;
  private focusTargetUUID?: string;
  private pendingTimer?: unknown;
  private stateVersion = 0;

  constructor(match: Match, playerNo: number, scheduler: BotScheduler = defaultScheduler) {
    this.match = match;
    this.playerNo = playerNo;
    this.scheduler = scheduler;
  }

  /** The bot player of the match. */
  get player() {
    return this.match.players[this.playerNo];
  }

  /**
   * Handles the matchmaking start event by readying up for `TurnPhase.Init`
   * through the regular `onReady` handler, just as a human client does once its
   * game scene loads.
   */
  onMatchStart(io: Server): void {
    onReady(io, this.match, this.player, TurnPhase.Init);
  }

  /**
   * Handles a newly emitted `ClientState` for the bot player. Cancels any
   * pending reaction for an older state and, when it is the bot's turn to act,
   * schedules a single action after a short reaction delay matching client
   * animations.
   */
  onState(io: Server, state: ClientState): void {
    this.cancelPendingAction();
    const version = ++this.stateVersion;
    if (state.gameResult || !state.playerPendingAction) return;
    const delayMs = this.reactionDelayFor(state);
    this.pendingTimer = this.scheduler.schedule(delayMs, () => {
      this.pendingTimer = undefined;
      if (version != this.stateVersion || this.match.gameResult.gameOver) return;
      this.reactToState(io, state);
    });
  }

  /** Cancels any pending scheduled reaction when the match ends or unregisters. */
  onMatchEnd(): void {
    ++this.stateVersion;
    this.cancelPendingAction();
  }

  private cancelPendingAction(): void {
    if (this.pendingTimer !== undefined) {
      this.scheduler.cancel(this.pendingTimer);
      this.pendingTimer = undefined;
    }
  }

  private reactionDelayFor(state: ClientState): number {
    if (state.battle.recentAttack) return defaultBotReactionDelays.attack;
    if (state.events.some(e => e.type == EventType.Retract)) return defaultBotReactionDelays.retract;
    if (state.highlightCardUUID) return defaultBotReactionDelays.tactic;
    return defaultBotReactionDelays.normal;
  }

  private reactToState(io: Server, state: ClientState): void {
    if (state.turnPhase == TurnPhase.Init) {
      if (!this.player.ready) onReady(io, this.match, this.player, TurnPhase.Init);
      return;
    }
    if (state.intervention) {
      this.playInterventionOrSkip(io, state);
      return;
    }
    switch (state.turnPhase) {
      case TurnPhase.Build:
        if (state.playerIsActive) this.buildAction(io, state);
        else onReady(io, this.match, this.player, TurnPhase.Build, selectInterceptingShips(state));
        break;
      case TurnPhase.Combat:
        this.combatAction(io, state);
        break;
      case TurnPhase.End:
        this.endPhaseAction(io, state);
        break;
    }
  }

  private playInterventionOrSkip(io: Server, state: ClientState): void {
    if (this.tryPlayHandCard(io, state)) return;
    onReady(io, this.match, this.player, state.turnPhase);
  }

  private buildAction(io: Server, state: ClientState): void {
    if (state.player.hasToRetractCards) {
      const retract = selectRetractableCard(state);
      if (retract) onRetract(io, this.match, this.player, retract.rootUUID, retract.subUUID);
      return;
    }
    if (this.tryPlayHandCard(io, state)) return;
    onReady(io, this.match, this.player, TurnPhase.Build, planBattle(state));
  }

  private tryPlayHandCard(io: Server, state: ClientState): boolean {
    const handCard = selectHandCard(state.player.hand);
    if (!handCard) return false;
    const target = selectTarget(handCard, state);
    if (!target) return false;
    const options = selectCardOptions(handCard);
    onHandCard(io, this.match, this.player, handCard.uuid, target.uuid, options);
    return true;
  }

  private combatAction(io: Server, state: ClientState): void {
    const attack = selectAttack(state, this.focusTargetUUID);
    if (attack) {
      this.focusTargetUUID = attack.targetUUID;
      onAttack(io, this.match, this.player, attack.shipUUID, attack.weaponUUID, attack.targetUUID);
    } else {
      onReady(io, this.match, this.player, TurnPhase.Combat);
    }
  }

  private endPhaseAction(io: Server, state: ClientState): void {
    if (state.player.hand.length > state.player.handCardLimit && state.player.hand.length > 0) {
      onDiscard(io, this.match, this.player, state.player.hand[0].uuid);
    }
  }
}
