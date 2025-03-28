import { CardType, InterventionType, TacticDiscipline, Zone } from '../../../shared/config/enums';
import Player from '../../game_state/player';
import { opponentPlayerNo, spliceCardStackByUUID } from '../../utils/helpers';
import ActionPool, { CardAction } from '../action_pool';
import CardStack from '../card_stack';
import TacticCard from '../types/tactic_card';

abstract class IntelligenceTacticCard extends TacticCard {
  get discipline(): TacticDiscipline {
    return TacticDiscipline.Intelligence;
  }
}

export class Card149 extends IntelligenceTacticCard {
  private readonly cardsToDraw = 2;
  constructor() {
    super(149, 'Expertenkonferenz', 2);
  }
  onEnterGame(player: Player) {
    for (let i = 0; i < this.cardsToDraw; i++) {
      this.drawSpecificCard(player, c => c.type == CardType.Tactic);
    }
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
}

export class Card176 extends IntelligenceTacticCard {
  private readonly countersDisciplines = [TacticDiscipline.Intelligence, TacticDiscipline.Military];
  constructor() {
    super(176, 'Gegenspionage', 1);
  }
  onEnterGame(player: Player) {
    this.onEnterGameInterventionTacticCard(player);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.getValidTargetsInterventionTacticCard(player, this.countersDisciplines);
  }
  protected override get interventionType(): InterventionType | undefined {
    return InterventionType.TacticCard;
  }
}

export class Card208 extends IntelligenceTacticCard {
  private readonly oneTimeActionPool = new ActionPool(
    new CardAction(TacticDiscipline.Intelligence),
    new CardAction(TacticDiscipline.Science),
    new CardAction(TacticDiscipline.Trade)
  );
  constructor() {
    super(208, 'Informationshändler', 4);
  }
  onEnterGame(player: Player) {
    player.actionPool.push(...this.oneTimeActionPool.pool);
    this.drawSpecificCard(player, c => c.type == CardType.Tactic);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(player.cardStacks);
  }
}

export class Card214 extends IntelligenceTacticCard {
  constructor() {
    super(
      214,
      'Bombenanschlag',
      3,
      {},
      {
        range: 0,
        damage: 3,
        pointDefense: 0,
        shield: 0,
        armour: 0
      }
    );
  }
  onEnterGame(player: Player, target: CardStack) {
    this.attackByTactic(player, target);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.getOpponentPlayer(player).cardStacks.filter(cs => cs.zone == Zone.Colony);
  }
}

export class Card231 extends IntelligenceTacticCard {
  private readonly removeActions: CardAction[] = [CardType.Hull, CardType.Equipment].map(
    ct => new CardAction(ct)
  );
  constructor() {
    super(231, 'Unruhen schüren', 2);
  }
  onEnterGame(player: Player) {
    this.getOpponentPlayer(player).actionPool.remove(...this.removeActions);
  }
  getValidTargets(player: Player): CardStack[] {
    return player.isActivePlayer ? [] : this.onlyColonyTarget(this.getOpponentPlayer(player).cardStacks);
  }
  protected override get interventionType(): InterventionType | undefined {
    return InterventionType.OpponentTurnStart;
  }
}

export class Card323 extends IntelligenceTacticCard {
  constructor() {
    super(
      323,
      'Sabotage',
      2,
      {},
      {
        range: 0,
        damage: 2,
        pointDefense: 0,
        shield: 0,
        armour: 0
      }
    );
  }
  onEnterGame(player: Player, target: CardStack) {
    this.attackByTactic(player, target);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.getOpponentPlayer(player).cardStacks;
  }
}

export class Card416 extends IntelligenceTacticCard {
  private readonly speedLimit = 0;
  constructor() {
    super(416, 'Lücke im Verteidigungsnetz', 3);
  }
  onEnterGame(player: Player, target: CardStack) {
    spliceCardStackByUUID(player.match.battle.ships[opponentPlayerNo(player.no)], target.uuid);
  }
  getValidTargets(player: Player): CardStack[] {
    return player.match.battle.ships[player.match.waitingPlayerNo].filter(
      cs => cs.profile.speed <= this.speedLimit && cs.isInBattle && cs.type == CardType.Hull
    );
  }
  protected override get interventionType(): InterventionType | undefined {
    return InterventionType.BattleRoundStart;
  }
}

export class Card330 extends IntelligenceTacticCard {
  private readonly cardsToDiscard = 5;
  constructor() {
    super(330, 'Tiefeninfiltration', 2);
  }
  onEnterGame(player: Player) {
    this.getOpponentPlayer(player).discardCards(
      ...this.getOpponentPlayer(player).pickCardsFromDeck(this.cardsToDiscard)
    );
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(this.getOpponentPlayer(player).cardStacks);
  }
}

export class Card430 extends IntelligenceTacticCard {
  private readonly cardsToDiscard = 3;
  private readonly cardsToDraw = 1;
  constructor() {
    super(430, 'Informant auf Ganymed', 2);
  }
  onEnterGame(player: Player) {
    player.drawCards(this.cardsToDraw);
    this.getOpponentPlayer(player).discardCards(
      ...this.getOpponentPlayer(player).pickCardsFromDeck(this.cardsToDiscard)
    );
  }
  getValidTargets(player: Player): CardStack[] {
    return this.onlyColonyTarget(this.getOpponentPlayer(player).cardStacks);
  }
}
