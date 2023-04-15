import Card from '../card';
import CardProfile from '../card_profile';
import CardStack from '../card_stack';
import Match from '../../game_state/match'
import { AttackProfile } from '../card_profile';
import { HullProfile } from './hullCard';
import { CardType } from '../../config/oc_enums';

export default abstract class EquipmentCard extends Card {
    readonly equipmentProfile!: EquipmentProfile;
    readonly attackProfile?: AttackProfile;
    constructor(id: number, name: string, profile: EquipmentProfile, attackProfile?: AttackProfile) {
        super(id, name, CardType.Equipment);
        this.equipmentProfile = profile;
        this.attackProfile = attackProfile;
    }
    canBeAttachedTo(cardStacks: Array<CardStack>): Array<CardStack> {
        return cardStacks.filter((cs: CardStack) => 
            cs.card.type == CardType.Hull 
            && cs.profileMatches(this.profile()));
    }
    canBeAttachedToColony(cardStacks: Array<CardStack>): boolean {
        return false;
    }
    isPlayableDecorator(match: Match, playerNo: number): boolean {
        return this.canBeAttachedTo(match.players[playerNo].cardStacks).length > 0;
    }
    profile(): CardProfile {
        return <CardProfile> this.equipmentProfile;
    }
}

export class EquipmentProfile extends HullProfile {
    readonly pointDefense: number = 0;
    readonly shield: number = 0;
    readonly armour: number = 0;
}
