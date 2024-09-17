import { CardSubtype, CardType, TacticDiscipline } from '../../shared/config/enums';
import Card from './card';
import TacticCard from './types/tactic_card';

export class CardAction {
  possibleCardTypes!: CardSubtype[];
  depleted: boolean = false;
  constructor(...possibleCardTypes: CardSubtype[]) {
    this.possibleCardTypes = possibleCardTypes;
  }
  canBeUsedFor(cardType: CardSubtype): boolean {
    return (
      this.possibleCardTypes.includes(cardType) ||
      (this.isTacticDiscipline(cardType) && this.possibleCardTypes.includes(CardType.Tactic))
    );
  }
  priority(): number {
    return this.isTacticDiscipline(this.possibleCardTypes[0]) ? 10 : this.possibleCardTypes.length;
  }
  toString(): string {
    return this.possibleCardTypes.sort().join('_');
  }
  private isTacticDiscipline(cardType: CardSubtype): boolean {
    return Object.values(TacticDiscipline)
      .map(td => <CardSubtype>td)
      .includes(cardType);
  }
}

export default class ActionPool {
  private cardActions!: CardAction[];
  constructor(...cardActions: CardAction[]) {
    this.cardActions = cardActions ?? [];
  }
  get pool() {
    return this.cardActions.slice();
  }
  activate(card: Card) {
    this.activateCardType(this.cardSubtypeFromCard(card));
  }
  combine(ap: ActionPool): ActionPool {
    return new ActionPool(...this.cardActions.concat(ap.cardActions));
  }
  hasActionFor(card: Card): boolean {
    return this.hasActionForCardType(this.cardSubtypeFromCard(card));
  }
  push(...pool: CardAction[]) {
    this.cardActions.push(...pool);
  }
  remove(...cardActions: CardAction[]) {
    cardActions
      .map(a => a.toString())
      .forEach(s => {
        this.cardActions.filter(p => p.toString() == s)[0].depleted = true;
        this.removeDepleted();
      });
  }
  includesAllOf(actionPool: ActionPool): boolean {
    const thisActions = this.pool.map(ca => ca.toString());
    const compareActions = actionPool.pool.map(ca => ca.toString());
    return compareActions.every(
      a =>
        thisActions.includes(a) &&
        thisActions.filter(e => a == e).length >= compareActions.filter(e => a == e).length
    );
  }
  private cardSubtypeFromCard(card: Card): CardSubtype {
    return card.type == CardType.Tactic ? (<TacticCard>card).discipline : card.type;
  }
  private activateCardType(cardType: CardSubtype) {
    const usedAction = this.getActionsForCardType(cardType)
      .sort((a, b) => b.priority() - a.priority())
      .pop();
    if (usedAction) {
      usedAction.depleted = true;
      this.removeDepleted();
    }
  }
  private hasActionForCardType(cardType: CardSubtype): boolean {
    return this.getActionsForCardType(cardType).length > 0;
  }
  private getActionsForCardType(cardType: CardSubtype): CardAction[] {
    return this.pool.filter(ap => ap.canBeUsedFor(cardType));
  }
  private removeDepleted() {
    const depleted = this.cardActions.filter(a => a.depleted);
    this.cardActions = this.cardActions.filter(a => !a.depleted);
    depleted.forEach(a => (a.depleted = false));
  }
  static sortOrder(a: CardAction, b: CardAction): number {
    if (a.priority() == b.priority()) {
      if (a.toString() < b.toString()) return -1;
      else if (a.toString() > b.toString()) return 1;
      else return 0;
    } else {
      return a.priority() - b.priority();
    }
  }
}
