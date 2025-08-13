import Card from '../cards/card';
import CardStack from '../cards/card_stack';
import { Attack } from '../game_state/battle';

export function arrayDiff<T>(array1: T[], array2: T[]): [T[], T[]] {
  const a1 = array1.slice();
  const a2 = array2.slice();
  a1.slice().forEach(v1 => {
    const i1 = a1.indexOf(v1);
    const i2 = a2.indexOf(v1);
    if (i1 >= 0 && i2 >= 0) {
      a1.splice(i1, 1);
      a2.splice(i2, 1);
    }
  });
  return [a1, a2];
}

export function getCardStackByUUID(cardStacks: CardStack[], uuid: string): CardStack | undefined {
  return cardStacks.find(cs => cs.uuid == uuid);
}

export function removeFirstMatchingElement<T>(array: T[], f: (o: T) => boolean): T[] {
  const index = array.findIndex(f);
  if (index !== -1) array.splice(index);
  return array;
}

export function opponentPlayerNo(playerNo: number): number {
  return playerNo == 0 ? 1 : 0;
}

export function shuffle<T>(array: T[]): T[] {
  return array.sort(() => Math.random() - 0.5);
}

export function spliceCardStackByUUID(cardStacks: CardStack[], uuid: string): CardStack | undefined {
  return spliceFrom(cardStacks, e => e.uuid == uuid);
}

export function spliceCardById(cards: Card[], id: number): Card | undefined {
  return spliceFrom(cards, e => e.id == id);
}

export function spliceFrom<T>(l: T[], find: (e: T) => boolean): T | undefined {
  const i = l.findIndex(find);
  return i == -1 ? undefined : l.splice(i, 1)[0];
}

export function combineAttackResults(a1: Attack | undefined, a2: Attack | undefined): Attack | undefined {
  if (!a1) return a2;
  else if (!a2) return a1;
  else
    return {
      sourceUUID: a1.sourceUUID,
      sourceIndex: a1.sourceIndex,
      targetUUID: a1.targetUUID,
      pointDefense: a1.pointDefense + a2.pointDefense,
      shield: a1.shield + a2.shield,
      armour: a1.armour + a2.armour,
      damage: a1.damage + a2.damage
    };
}
