import CardStack from './card_stack';
import CardProfile from './card_profile';
import { CardType } from '../config/oc_enums';

export default abstract class Card {
    readonly id!: number;
    readonly name!: string;
    readonly type!: CardType;
    constructor(id: number, name: string, type: CardType) {
        this.id = id;
        this.name = name;
        this.type = type;
    }
    abstract canBeAttachedTo(cardStacks: Array<CardStack>): Array<CardStack>
    abstract canBeAttachedToColony(cardStacks: Array<CardStack>): boolean
    abstract profile(): CardProfile
}
