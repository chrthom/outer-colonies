import CardStack from "../cards/card_stack";

export function getCardStackByUUID(cardStacks: Array<CardStack>, uuid: string): CardStack {
    return cardStacks.find(cs => cs.uuid == uuid);
}

export function spliceCardStackByUUID(cardStacks: Array<CardStack>, uuid: string): CardStack {
    return cardStacks.splice(cardStacks.findIndex(cs => cs.uuid == uuid), 1)[0];
}
