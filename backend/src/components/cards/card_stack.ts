import Card from './card';
import CardProfile from './card_profile';
import { CardType, Zone } from '../config/enums';
import { v4 as uuidv4 } from 'uuid';
import ActionPool from './action_pool';
import Player from '../game_state/player';

export default class CardStack {
    card!: Card;
    zone: Zone;
    uuid!: string;
    attachedCards: CardStack[] = [];
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
    attack(target: CardStack) {
        if (!this.attackAvailable) {
            console.log(`WARN: ${this.getPlayer().name} tried to attack with a card ${this.card.name}, which cannot attack`);
        } else if (!this.card.isInRange(this.getPlayer().match.battle.range)) {
            console.log(`WARN: ${this.getPlayer().name} tried to attack with a card ${this.card.name} at wrong range`);
        } else {
            this.card.attack(this, target);
            this.attackAvailable = false;
        }
    }
    canAttack(player: Player) {
        return this.attackAvailable && this.card.isInRange(player.match.battle.range);
    }
    canBeAttachedTo(cardStack: CardStack): boolean {
        return this.zone == Zone.Hand && this.getValidTargets().map(cs => cs.uuid).includes(cardStack.uuid);
    }
    combatPhaseReset(initial: boolean) {
        this.attachedCards.forEach(cs => cs.combatPhaseReset(initial));
        if (initial || this.card.doesRechargeBetweenCombatPhases) {
            if (this.card.canAttack()) this.attackAvailable = true;
            if (this.card.canDefend()) this.defenseAvailable = true;
        }
    }
    getCards(): Card[] {
        return this.getCardStacks().map(cs => cs.card);
    }
    getCardStacks(): CardStack[] {
        return this.attachedCards.flatMap(cs => cs.getCardStacks()).concat(this);
    }
    getPlayer(): Player {
        return this.parentCardStack ? this.parentCardStack.getPlayer() : this.parentPlayer;
    }
    getRootCardStack(): CardStack {
        if (this.parentCardStack) return this.parentCardStack.getRootCardStack();
        else return this;
    }
    getValidTargets(): CardStack[] {
        if (this.zone == Zone.Hand) {
            return this.card.getValidTargets(this.getPlayer());
        } else {
            return []; // FEATURE: Reuse this method to determine valid attack targets in battle
        }
    }
    isFlightReady(): boolean {
        return this.card.isFlightReady(this.getCards());
    }
    isMissionReady(): boolean {
        return this.zone == Zone.Oribital && this.type() == CardType.Hull && this.profile().speed > 0;
    }
    isPlayable(): boolean {
        return this.zone == Zone.Hand && this.card.isPlayable(this.getPlayer());
    }
    performImmediateEffect(target: CardStack) {
        this.card.immediateEffect(this.getPlayer(), target);
    }
    profile(): CardProfile {
        if (this.type() == CardType.Colony) {
            const colonyCardsProfile = this.getPlayer().cardStacks
                .filter(cs => cs.zone == Zone.Colony)
                .filter(cs => [ CardType.Orb, CardType.Infrastructure ].includes(cs.type()))
                .map(cs => cs.profile())
                .reduce((a, b) => CardProfile.combineCardProfiles(a, b), new CardProfile());
            return CardProfile.combineCardProfiles(colonyCardsProfile, this.card.profile());
        } else {
            return this.getCards()
                .map(c => c.profile())
                .reduce((a, b) => CardProfile.combineCardProfiles(a, b));
        }
    }
    profileMatches(c: CardProfile): boolean {
        return CardProfile.isValid(CardProfile.combineCardProfiles(this.profile(), c));
    }
    type(): CardType {
        return this.card.type;
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
