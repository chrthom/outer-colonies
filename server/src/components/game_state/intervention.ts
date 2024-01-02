import { InterventionType } from '../../shared/config/enums';
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
  abstract skip(): void;
  get hasValidTargets() {
    return this.match.getPendingActionPlayer().hand.some(cs => cs.hasValidTargets);
  }
  checkSkip() {
    console.log(`Check Intervention ${this.type} for player ${this.match.actionPendingByPlayerNo}`); ////
    if (!this.hasValidTargets) {
      this.skip();
    } else {
      console.log(`Ask to perform intervention ${this.type}`); ////
    }
  }
  remove() {
    this.match.intervention = undefined;
  }
  activateActivePlayer() {
    this.match.actionPendingByPlayerNo = this.match.activePlayerNo;
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
    console.log(`Skip ${this.type}`); ////
    this.switchPendingPlayer();
    this.remove();
    this.match.prepareBuildPhase();
  }
}

export class InterventionBattleRoundEnd extends Intervention {
  constructor(match: Match) {
    super(InterventionType.BattleRoundEnd, match);
  }
  skip() {
    console.log(`Skip ${this.type}`); ////
    if (this.match.actionPendingByPlayerNo == this.match.activePlayerNo) {
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
    console.log(`Skip ${this.type}`); ////
    this.switchPendingPlayer();
    if (this.match.actionPendingByPlayerNo == this.match.getInactivePlayerNo()) {
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
    console.log(`Skip ${this.type}`); ////
    this.switchPendingPlayer();
    this.remove();
    this.src.attack(this.target);
  }
}

export class InterventionTacticCard extends Intervention {
  src!: CardStack;
  target!: CardStack;
  parentIntervention?: Intervention;
  constructor(match: Match, src: CardStack, target: CardStack) {
    super(InterventionType.TacticCard, match);
    this.src = src;
    this.target = target;
    this.parentIntervention = this.match.intervention;
  }
  skip() {
    console.log(`Skip ${this.type}`); ////
    this.switchPendingPlayer();
    this.match.intervention = this.parentIntervention;
    this.src.playHandCard(this.target);
    this.match.checkToNextPhase();
  }
}
