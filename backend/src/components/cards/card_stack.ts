import Card from './card';
import CardProfile from './card_profile';
import { CardType, TurnPhase, Zone } from '../config/enums';
import { v4 as uuidv4 } from 'uuid';
import ActionPool from './action_pool';
import Player from '../game_state/player';
import { spliceCardStackByUUID } from '../utils/utils';

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
    canBeRetracted(): boolean {
        const player = this.getPlayer();
        return player.isActivePlayer()
            && player.match.turnPhase == TurnPhase.Build
            && this.card.canBeRetracted()
            && player.actionPool.getPool().join('_') == player.getOriginalActions().getPool().join('_'); // TODO: Check if this can be done easier
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
    hasInsufficientEnergy(): boolean {
        const rootCardStack = this.getRootCardStack();
        if (this.type() == CardType.Colony) {
            return false;
        } else if (rootCardStack.zone == Zone.Colony && rootCardStack.type() == CardType.Infrastructure) {
            return this.card.profile().energy < 0 && this.getPlayer().getColonyCardStack().profile().energy < 0;
        } else {
            return this.card.profile().energy < 0 && rootCardStack.profile().energy < 0;
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
    onDestruction() {
        this.card.onDestruction(this.getPlayer());
        this.attachedCards.forEach(cs => cs.onDestruction());
    }
    performImmediateEffect(target: CardStack) {
        this.card.immediateEffect(this.getPlayer(), target);
    }
    profile(): CardProfile {
        if (this.type() == CardType.Colony) {
            const handCardLimitOutsideColonyZone = this.getPlayer().cardStacks
                .filter(cs => cs.zone != Zone.Colony)
                .filter(cs => cs.type() == CardType.Infrastructure)
                .map(cs => cs.profile().handCardLimit)
                .reduce((a, b) => a + b, 0);
            let colonyCardsProfile = this.getPlayer().cardStacks
                .filter(cs => cs.zone == Zone.Colony)
                .filter(cs => [ CardType.Orb, CardType.Infrastructure ].includes(cs.type()))
                .map(cs => cs.profile())
                .reduce((a, b) => CardProfile.combineCardProfiles(a, b), new CardProfile());
            colonyCardsProfile.handCardLimit += handCardLimitOutsideColonyZone;
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
    retract() {
        if (this.parentCardStack) {
            spliceCardStackByUUID(this.parentCardStack.attachedCards, this.uuid);
        } else {
            spliceCardStackByUUID(this.getPlayer().cardStacks, this.uuid);
        }
        this.getPlayer().takeCards(...this.getCards().filter(c => c.canBeRetracted()));
        this.getPlayer().discardCards(...this.getCards().filter(c => !c.canBeRetracted()));
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
