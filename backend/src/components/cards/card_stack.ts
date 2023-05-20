import Card from './card';
import CardProfile from './card_profile';
import { CardType, Zone } from '../config/enums';
import { v4 as uuidv4 } from 'uuid';
import HullCard from './types/hullCard';
import ActionPool from './action_pool';

export default class CardStack {
    card!: Card;
    zone!: Zone;
    uuid!: string;
    attachedCards: Array<CardStack> = [];
    damage: number = 0;
    attackAvailable: boolean = false;
    defenseAvailable: boolean = false;
    constructor(card: Card, zone: Zone) {
        this.card = card;
        this.zone = zone;
        this.uuid = uuidv4();
    }
    profile(): CardProfile {
        return this.getCards()
            .map(c => c.profile())
            .reduce((a, b) => CardProfile.combineCardProfiles(a, b));
    }
    actionPool(): ActionPool {
        return this.getCards().map(c => c.actionPool()).reduce((a, b) => a.combine(b));
    }
    profileMatches(c: CardProfile): boolean {
        return CardProfile.isValid(CardProfile.combineCardProfiles(this.profile(), c));
    }
    getCards(): Array<Card> {
        return this.getCardStacks().map(cs => cs.card);
    }
    getCardStacks(): Array<CardStack> {
        return this.attachedCards.flatMap(cs => cs.getCardStacks()).concat(this);
    }
    isMissionReady(): boolean {
        return this.zone == Zone.Oribital && this.card.type == CardType.Hull && this.profile().speed > 0;
    }
    isFlightReady(): boolean {
        return this.card.type == CardType.Hull
            && this.getCards().filter(c => c.type == CardType.Hull).length == (<HullCard> this.card).multipart.partNo;
    }
    combatPhaseReset() {
        this.attachedCards.forEach(cs => cs.combatPhaseReset());
        if (this.card.canAttack()) this.attackAvailable = true; // TODO: Do not reset weapons, which only have one attack per battle
        if (this.card.canDefend()) this.defenseAvailable = true;
    }
}