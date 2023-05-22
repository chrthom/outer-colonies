import Card from './card';
import CardProfile from './card_profile';
import { CardType, Zone } from '../config/enums';
import { v4 as uuidv4 } from 'uuid';
import HullCard from './types/hull_card';
import ActionPool from './action_pool';
import Player from '../game_state/player';

export default class CardStack {
    card!: Card;
    zone: Zone;
    uuid!: string;
    attachedCards: Array<CardStack> = [];
    damage: number = 0;
    attackAvailable: boolean = false;
    defenseAvailable: boolean = false;
    protected parentCardStack: CardStack;
    protected parentPlayer: Player;
    constructor(card: Card) {
        this.card = card;
        this.uuid = uuidv4();
    }
    actionPool(): ActionPool {
        return this.getCards().map(c => c.actionPool()).reduce((a, b) => a.combine(b));
    }
    attach(cardStack: CardStack) {
        cardStack.parentCardStack = this;
        this.attachedCards.push(cardStack);
    }
    combatPhaseReset() {
        this.attachedCards.forEach(cs => cs.combatPhaseReset());
        if (this.card.canAttack()) this.attackAvailable = true; // TODO: Do not reset weapons, which only have one attack per battle
        if (this.card.canDefend()) this.defenseAvailable = true;
    }
    getCards(): Array<Card> {
        return this.getCardStacks().map(cs => cs.card);
    }
    getCardStacks(): Array<CardStack> {
        return this.attachedCards.flatMap(cs => cs.getCardStacks()).concat(this);
    }
    getPlayer(): Player {
        return this.parentCardStack ? this.parentCardStack.getPlayer() : this.parentPlayer;
    }
    isFlightReady(): boolean {
        return this.card.type == CardType.Hull
            && this.getCards().filter(c => c.type == CardType.Hull).length == (<HullCard> this.card).multipart.partNo;
    }
    isMissionReady(): boolean {
        return this.zone == Zone.Oribital && this.card.type == CardType.Hull && this.profile().speed > 0;
    }
    profile(): CardProfile {
        return this.getCards()
            .map(c => c.profile())
            .reduce((a, b) => CardProfile.combineCardProfiles(a, b));
    }
    profileMatches(c: CardProfile): boolean {
        return CardProfile.isValid(CardProfile.combineCardProfiles(this.profile(), c));
    }
}

export class RootCardStack extends CardStack {
    constructor(card: Card, zone: Zone, player: Player) {
        super(card);
        this.zone = zone;
        this.parentPlayer = player;
    }
}

export class AttachmentCardStack extends CardStack {
    constructor(card: Card, parentCardStack: CardStack) {
        super(card);
        this.parentCardStack = parentCardStack;
    }
}
