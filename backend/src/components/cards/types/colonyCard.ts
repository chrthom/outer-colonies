import { CardType } from "../../config/enums";
import { rules } from "../../config/rules";
import Match from "../../game_state/match";
import Card from "../card";
import CardProfile from "../card_profile";
import CardStack from "../card_stack";

export default class ColonyCard extends Card {
    constructor() {
        super(0, 'Colony', CardType.Colony);
    }
    filterValidAttachTargets(cardStacks: CardStack[]): CardStack[] {
        return [];
    }
    protected isPlayableDecorator(match: Match, playerNo: number): boolean {
        return false;
    }
    profile(): CardProfile {
        return {
            energy: 0,
            hp: rules.colonyHP,
            speed: 0,
            pointDefense: 0,
            shield: 0,
            armour: 0,
            theta: 0,
            xi: 99,
            phi: 99,
            omega: 99,
            delta: 99,
            psi: 99
        }
    }
}