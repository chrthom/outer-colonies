import { CardDurability, InterventionType } from '../../shared/config/enums';
import CardStack from '../cards/card_stack';
import Match from './match';

export default abstract class Intervention {
  type!: InterventionType;
  match!: Match;
  constructor(type: InterventionType, match: Match) {
    this.type = type;
    this.match = match;
  }
  init() {
    this.match.intervention = this;
    if (this.switchPendingPlayerOnInit) this.switchPendingPlayer();
    this.checkSkip();
  }
  /**
   * Root of the pending intervention chain. Interventions nested into another intervention
   * (e.g. a tactic card played during an intervention window) resolve first; their parent
   * intervention is restored only afterwards.
   */
  get root(): Intervention {
    return this instanceof InterventionTacticCard && this.parentIntervention
      ? this.parentIntervention.root
      : this;
  }
  abstract skip(): void;
  get hasValidTargets() {
    return this.match.pendingActionPlayer.hand.some(cs => cs.hasValidTargets);
  }
  checkSkip() {
    if (!this.hasValidTargets) this.skip();
  }
  remove() {
    this.match.intervention = undefined;
  }
  activateActivePlayer() {
    this.match.pendingActionPlayerNo = this.match.activePlayerNo;
  }
  switchPendingPlayer() {
    this.match.switchPendingPlayer();
  }
  protected get switchPendingPlayerOnInit() {
    return true;
  }
}

export class InterventionOpponentTurnStart extends Intervention {
  constructor(match: Match) {
    super(InterventionType.OpponentTurnStart, match);
  }
  skip() {
    this.switchPendingPlayer();
    this.remove();
    this.match.prepareBuildPhase();
  }
}

/**
 * Intervention window for the defender between the announcement of a raid and
 * the nomination of the defense fleet. The defender is already the pending
 * action player when this is initialized (set by
 * Match.prepareBuildPhaseReaction), so the pending player is not switched on
 * init. Skipping the window just removes the intervention, leaving the match
 * in the build phase with the defender pending, i.e. the regular
 * prepareCombatPhase flow for the defense fleet nomination continues.
 */
export class InterventionOpponentRaidStart extends Intervention {
  constructor(match: Match) {
    super(InterventionType.OpponentRaidStart, match);
  }
  skip() {
    this.remove();
  }
  protected override get switchPendingPlayerOnInit() {
    return false;
  }
}

export class InterventionBattleRoundEnd extends Intervention {
  constructor(match: Match) {
    super(InterventionType.BattleRoundEnd, match);
  }
  skip() {
    if (this.match.pendingActionPlayerNo == this.match.activePlayerNo) {
      new InterventionBattleRoundEnd(this.match).init();
    } else {
      this.match.battle.processEndOfBattlePhase(this.match);
      this.match.battle.processBattleRound(this.match);
      new InterventionBattleRoundStart(this.match).init();
    }
  }
}

export class InterventionBattleRoundStart extends Intervention {
  constructor(match: Match) {
    super(InterventionType.BattleRoundStart, match);
  }
  skip() {
    this.switchPendingPlayer();
    if (this.match.pendingActionPlayerNo == this.match.inactivePlayerNo) {
      new InterventionBattleRoundStart(this.match).init();
    } else {
      this.remove();
    }
  }
  protected override get switchPendingPlayerOnInit() {
    return false;
  }
}

export class InterventionAttack extends Intervention {
  src!: CardStack;
  target!: CardStack;
  constructor(match: Match, src: CardStack, target: CardStack) {
    super(InterventionType.Attack, match);
    this.src = src;
    this.target = target;
  }
  skip() {
    this.switchPendingPlayer();
    this.remove();
    this.src.attack(this.target);
  }
}

export class InterventionTacticCard extends Intervention {
  src: CardStack;
  target: CardStack;
  optionalParameters?: number[];
  parentIntervention?: Intervention;
  constructor(match: Match, src: CardStack, target: CardStack, optionalParameters?: number[]) {
    super(InterventionType.TacticCard, match);
    this.src = src;
    this.target = target;
    this.optionalParameters = optionalParameters;
    this.parentIntervention = this.match.intervention;
  }
  skip() {
    this.switchPendingPlayer();
    this.match.intervention = this.parentIntervention;
    if (this.src.card.durability != CardDurability.Instant) {
      this.match.highlightCard = undefined;
    }
    this.src.playHandCard(this.target, this.optionalParameters);
    this.match.checkToNextPhase();
  }
}
