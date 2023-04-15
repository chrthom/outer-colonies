import Card from '../cards/card';
import CardStack from '../cards/card_stack';

class FrontendCardRequest {
    message!: string;
    srcIndex: number;
    options!: Array<FrontendCardRequestOption>;
}

class FrontendCardRequestOption {
    index: number;
    cardIds!: Array<string>;
}

export default function toFrontendCardRequest(cardStacks: Array<CardStack>, colony: boolean, srcIndex: number): FrontendCardRequest {
    const cardStackOptions: Array<FrontendCardRequestOption> = cardStacks.map((cs: CardStack, index: number) => {
        const cardIds = cs.getCards().map((c: Card) => c.id.toString());
        return {
            index: index,
            cardIds: cardIds
        };
    });
    const colonyOption: Array<FrontendCardRequestOption> = colony ? [ { index: cardStackOptions.length, cardIds: [ 'colony' ] } ] : [];
    return {
        message: 'TBD', // TODO: Add message here
        srcIndex: srcIndex,
        options: cardStackOptions.concat(colonyOption)
    };
}
