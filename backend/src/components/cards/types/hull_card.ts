import Card from '../card';
import CardProfile, { HullProfile } from '../card_profile';
import CardStack from '../card_stack';
import { CardType } from '../../config/enums';
import Player from '../../game_state/player';

export default abstract class HullCard extends Card {
    readonly multipart!: HullMultipart;
    readonly hullProfile!: HullProfile;
    constructor(id: number, name: string, multipart: HullMultipart, profile: HullProfile) {
        super(id, name, CardType.Hull);
        this.multipart = multipart;
        this.hullProfile = profile;
    }
    getValidTargets(player: Player): CardStack[] {
        return this.filterAttachableHull(player.cardStacks).concat(this.filterAttachableColony(player.cardStacks));
    }
    private filterAttachableHull(cardStacks: CardStack[]): CardStack[] {
        return cardStacks.filter(cs =>
            cs.type() == CardType.Hull 
                && (<HullCard> cs.card).multipart.neededPartIds.includes(this.id)
                && cs.attachedCards.filter(c => c.card.name == this.name).length == 0); // Reconsider if matching by name is a bad idea
    }
    private filterAttachableColony(cardStacks: CardStack[]): CardStack[] {
        return cardStacks.filter(cs => 
            cs.type() == CardType.Colony 
                && this.hullProfile.energy >= 0);
    }
    immediateEffect(_: Player) {}
    isFlightReady(cards: Card[]): boolean {
        return cards.filter(c => c.type == CardType.Hull).length == this.multipart.partNo;
    }
    profile(): CardProfile {
        return CardProfile.fromHullProfile(this.hullProfile);
    }
}

export class HullMultipart {
    partNo!: number;
    neededPartIds!: number[];
    static noMultipart: HullMultipart = {
        partNo: 1,
        neededPartIds: []
    };
}