import { Server } from 'socket.io';
import Match, { MatchBot } from '../game_state/match';
import { BattleType, TurnPhase } from '../../shared/config/enums';
import { planBattle, selectAttack, selectHandCard, selectInterceptingShips, selectTarget } from './strategy';

/**
 * Safety guard against infinite action loops: upper bound of bot actions per
 * trigger. A bot turn needs far fewer actions; if the guard ever kicks in, the
 * countdown automatic ready takes over as it does for human players.
 */
const maxActionsPerTrigger = 100;

/**
 * Server-side pseudo player for singleplayer games. The bot reacts to state
 * changes whenever it is the pending action player and issues its actions
 * through the same internal calls the socket handlers use, so all existing
 * validation applies unchanged. It acts immediately, without artificial
 * thinking delay.
 */
export default class Bot implements MatchBot {
  readonly match: Match;
  readonly playerNo: number;
  private focusTargetUUID?: string;

  constructor(match: Match, playerNo: number) {
    this.match = match;
    this.playerNo = playerNo;
  }

  /** The bot player of the match. */
  get player() {
    return this.match.players[this.playerNo];
  }

  /**
   * Performs bot actions as long as it is the bot's turn, emitting the state
   * to the human opponent after every action so the client renders each step
   * as it arrives.
   */
  act(io: Server) {
    for (let i = 0; i < maxActionsPerTrigger && this.needsAction(); i++) {
      this.performAction();
      this.match.emitState(io);
    }
  }

  /**
   * Returns whether the bot is expected to act: in the init phase until it is
   * ready, and in all other phases as long as it is the pending action player.
   */
  private needsAction(): boolean {
    if (this.match.gameResult.gameOver) return false;
    if (this.match.turnPhase == TurnPhase.Init) return !this.player.ready;
    return this.match.pendingActionPlayer.no == this.playerNo;
  }

  private performAction() {
    const match = this.match;
    if (match.turnPhase == TurnPhase.Init) {
      if (match.setReadyAndCheck(this.playerNo)) match.startMatch();
      return;
    }
    if (match.intervention) {
      this.playInterventionOrSkip();
      return;
    }
    switch (match.turnPhase) {
      case TurnPhase.Build:
        if (match.activePlayerNo == this.playerNo) this.buildAction();
        else match.prepareCombatPhase(selectInterceptingShips(this.player));
        break;
      case TurnPhase.Combat:
        this.combatAction();
        break;
      case TurnPhase.End:
        this.endPhaseAction();
        break;
    }
  }

  /**
   * Plays an intervention reaction card if the bot has a playable one,
   * otherwise skips the intervention window.
   */
  private playInterventionOrSkip() {
    const handCard = selectHandCard(this.player.hand);
    if (handCard) {
      const target = selectTarget(handCard);
      if (target && handCard.canBeAttachedTo(target)) {
        this.player.playHandCard(handCard, target);
        return;
      }
    }
    this.match.skipIntervention();
  }

  /**
   * The bot's own build phase: retract insufficient energy cards if necessary,
   * otherwise play the next affordable hand card on a random valid target, and
   * declare a battle once no more cards can be played.
   */
  private buildAction() {
    const player = this.player;
    if (player.hasInsufficientEnergyCard) {
      player.retractInsufficientEnergyCards();
      if (player.hasInsufficientEnergyCard) {
        // Remaining stacks cannot be retracted (e.g. actions already used):
        // end the turn like the automatic ready fallback would
        this.match.prepareBuildPhaseReaction({ type: BattleType.None, shipIds: [] });
      }
      return;
    }
    const handCard = selectHandCard(player.hand);
    if (handCard) {
      const target = selectTarget(handCard);
      if (target && handCard.canBeAttachedTo(target)) {
        player.playHandCard(handCard, target);
        return;
      }
    }
    this.match.prepareBuildPhaseReaction(planBattle(player));
  }

  /**
   * The combat phase: attack with the first available weapon, focusing all
   * weapons on one target until it is destroyed, and ready up once no more
   * attacks are possible.
   */
  private combatAction() {
    const attack = selectAttack(this.player, this.focusTargetUUID);
    if (attack) {
      this.focusTargetUUID = attack.target.uuid;
      this.match.planAttack(attack.srcWeapon, attack.target);
    } else {
      this.focusTargetUUID = undefined;
      this.match.processBattleRound();
    }
  }

  /**
   * The end phase: discard excess hand cards one by one, like the human
   * discard message does, until the hand card limit is met.
   */
  private endPhaseAction() {
    const player = this.player;
    if (player.hand.length > player.handCardLimit) {
      player.discardHandCards(player.hand[0].uuid);
    }
    this.match.prepareEndPhase();
  }
}

/**
 * Lets the bot of the given match act if it is its turn. Does nothing for
 * regular human matches and after the game is over.
 */
export function processBotActions(io: Server, match: Match): void {
  if (!match.bot || match.gameResult.gameOver) return;
  match.bot.act(io);
}
