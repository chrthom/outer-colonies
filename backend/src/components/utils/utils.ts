import CardStack from "../cards/card_stack";

export function getCardStackByUUID(cardStacks: CardStack[], uuid: string): CardStack {
    return cardStacks.find(cs => cs.uuid == uuid);
}

export function spliceCardStackByUUID(cardStacks: CardStack[], uuid: string): CardStack {
    return cardStacks.splice(cardStacks.findIndex(cs => cs.uuid == uuid), 1)[0];
}

export function shuffle<T>(array: T[]): T[] {
    return array.sort(() => Math.random() -0.5)
}
