import Card from './card';
import CardProfile from './card_profile';
import { Zone } from '../config/enums';
import { v4 as uuidv4 } from 'uuid';

export default class CardStack {
    card!: Card;
    zone!: Zone;
    uuid!: string;
    attachedCards: Array<CardStack> = [];
    damage: number = 0;
    constructor(card: Card, zone: Zone) {
        this.card = card;
        this.zone = zone;
        this.uuid = uuidv4();
    }
    profile(): CardProfile {
        return this.getCards()
            .map((c: Card) => c.profile())
            .reduce((a: CardProfile, b: CardProfile) => this.combineCardProfiles(a, b));
    }
    profileMatches(c: CardProfile): boolean {
        return Object.values(this.combineCardProfiles(this.profile(), c)).filter((v: number) => v < 0).length == 0;
    }
    getCards(): Array<Card> {
        return this.attachedCards.flatMap((cs: CardStack) => cs.getCards()).concat(this.card);
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