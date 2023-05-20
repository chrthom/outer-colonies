import Card from './card';
import CardProfile from './card_profile';
import { CardType, Zone } from '../config/enums';
import { v4 as uuidv4 } from 'uuid';
import HullCard from './types/hullCard';

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
            .reduce((a, b) => this.combineCardProfiles(a, b));
    }
    profileMatches(c: CardProfile): boolean {
        return Object.values(this.combineCardProfiles(this.profile(), c)).filter(v => v < 0).length == 0;
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
    private combineCardProfiles(c1: CardProfile, c2: CardProfile): CardProfile {
        return {
            hp: c1.hp + c2.hp,
            speed: c1.speed + c2.speed,
            energy: c1.energy + c2.energy,
            theta: c1.theta + c2.theta,
            xi: c1.xi + c2.xi,
            phi: c1.phi + c2.phi,
            omega: c1.omega + c2.omega,
            delta: c1.delta + c2.delta,
            psi: c1.psi + c2.psi,
            pointDefense: c1.pointDefense + c2.pointDefense,
            shield: c1.shield + c2.shield,
            armour: c1.armour + c2.armour
        }
    }
}