import { CardType } from '../config/enums';

export class CardAction {
  possibleCardTypes!: CardType[];
  depleted: boolean = false;
  constructor(...possibleCardTypes: CardType[]) {
    this.possibleCardTypes = possibleCardTypes;
  }
  canBeUsedFor(cardType: CardType): boolean {
    return this.possibleCardTypes.includes(cardType);
  }
  priority(): number {
    return this.possibleCardTypes.length;
  }
  toString(): string {
    return this.possibleCardTypes.sort().join('_');
  }
}

export default class ActionPool {
  private cardActions!: CardAction[];
  constructor(...cardActions: CardAction[]) {
    if (cardActions) this.cardActions = cardActions;
    else this.cardActions = [];
  }
  activate(cardType: CardType) {
    const availablePools = this.getActionsFor(cardType);
    if (availablePools.length > 0) {
      availablePools.sort((a, b) => a.priority() - b.priority())[0].depleted = true;
      this.removeDepleted();
    }
  }
  combine(ap: ActionPool): ActionPool {
    return new ActionPool(...this.cardActions.concat(ap.cardActions));
  }
  getActionsFor(cardType: CardType): CardAction[] {
    return this.pool.filter(ap => ap.canBeUsedFor(cardType));
  }
  get pool() {
    return this.cardActions.slice();
  }
  hasActionFor(cardType: CardType): boolean {
    return this.getActionsFor(cardType).length > 0;
  }
  push(...pool: CardAction[]) {
    this.cardActions.push(...pool);
  }
  remove(...cardActions: CardAction[]) {
    cardActions
      .map(a => a.toString())
      .forEach(s => {
        console.log(`Remove ${s} | Found ${this.cardActions.filter(p => p.toString() == s)}`); /////
        this.cardActions.filter(p => p.toString() == s)[0].depleted = true;
        this.removeDepleted();
      });
  }
  toString(): string {
    return this.pool.map(ca => ca.toString()).join('__');
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
