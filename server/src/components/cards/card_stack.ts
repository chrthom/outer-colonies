import Card from './card';
import CardProfile from './card_profile';
import { CardType, TurnPhase, Zone } from '../config/enums';
import { v4 as uuidv4 } from 'uuid';
import ActionPool from './action_pool';
import Player from '../game_state/player';
import { spliceCardStackByUUID } from '../utils/helpers';

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
            const attackResult = this.card.attack(this, target);
            this.getPlayer().match.battle.recentAttack = {
                sourceUUID: this.getRootCardStack().uuid,
                sourceIndex: this.getRootCardStack().getCardStacks().findIndex(cs => cs.uuid == this.uuid),
                targetUUID: target.uuid,
                pointDefense: attackResult.pointDefense,
                shield: attackResult.shield,
                armour: attackResult.armour,
                damage: attackResult.damage
            }
            this.attackAvailable = false;
        }
    }
    canAttack(player: Player) {
        return this.attackAvailable 
            && this.card.isInRange(player.match.battle.range)
            && this.getRootCardStack().isFlightReady();
    }
    canBeAttachedTo(cardStack: CardStack): boolean {
        return this.zone == Zone.Hand && this.getValidTargets().map(cs => cs.uuid).includes(cardStack.uuid);
    }
    canBeRetracted(): boolean {
        const player = this.getPlayer();
        return player.isActivePlayer()
            && player.isPendingPlayer()
            && player.match.turnPhase == TurnPhase.Build
            && this.card.canBeRetracted(this.isRootCard)
            && player.actionPool.toString() == player.getOriginalActions().toString();
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
            return []; // TODO: Reuse this method to determine valid attack targets in battle
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
        this.card.onUtilizaton(this.getPlayer(), target);
    }
    profile(): CardProfile {
        if (this.type() == CardType.Colony) {
            const handCardLimitOutsideColonyZone = this.getPlayer().cardStacks // Silos in orbit also increase hand card limit
                .filter(cs => cs.zone != Zone.Colony)
                .filter(cs => cs.type() == CardType.Infrastructure)
                .map(cs => cs.profile().handCardLimit)
                .reduce((a, b) => a + b, 0);
            const colonyCardsProfile = this.getPlayer().cardStacks
                .filter(cs => cs.zone == Zone.Colony)
                .filter(cs => [ CardType.Orb, CardType.Infrastructure ].includes(cs.type()))
                .map(cs => cs.profile())
                .reduce((a, b) => CardProfile.combineCardProfiles(a, b), new CardProfile());
            colonyCardsProfile.handCardLimit += handCardLimitOutsideColonyZone;
            colonyCardsProfile.hp = 0; // Else Building HP would increase the colony's HP
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
        this.getCards().forEach(c => c.onRetraction(this.getPlayer()));
        this.getPlayer().takeCards(this.getCards().filter(c => c.canBeRetracted(this.isRootCard)));
        this.getPlayer().discardCards(...this.getCards().filter(c => !c.canBeRetracted(this.isRootCard)));
    }
    type(): CardType {
        return this.card.type;
    }
    private get isRootCard() {
        return !this.parentCardStack;
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
