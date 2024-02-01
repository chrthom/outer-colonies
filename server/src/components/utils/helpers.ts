import CardStack from '../cards/card_stack';

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

export function opponentPlayerNo(playerNo: number): number {
  return playerNo == 0 ? 1 : 0;
}

export function shuffle<T>(array: T[]): T[] {
  return array.sort(() => Math.random() - 0.5);
}

export function spliceCardStackByUUID(cardStacks: CardStack[], uuid: string): CardStack {
  return cardStacks.splice(
    cardStacks.findIndex(cs => cs.uuid == uuid),
    1
  )[0];
}
