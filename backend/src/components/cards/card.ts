import CardStack from './card_stack';
import CardProfile from './card_profile';
import Match from '../game_state/match';
import { CardType, TurnPhase } from '../config/enums';
import ActionPool from './action_pool';

export default abstract class Card {
    readonly id!: number;
    readonly name!: string;
    readonly type!: CardType;
    playableOutsideBuildPhase: boolean = false;
    staysInPlay: boolean = true;
    constructor(id: number, name: string, type: CardType) {
        this.id = id;
        this.name = name;
        this.type = type;
    }
    abstract filterValidAttachTargets(cardStacks: Array<CardStack>): Array<CardStack>
    abstract immediateEffect(match: Match): void
    canBeAttachedTo(allCardStacks: Array<CardStack>, uuid: string): boolean {
        return this.filterValidAttachTargets(allCardStacks).map(cs => cs.uuid).includes(uuid);
    }
    canAttack(): boolean {
        return false;
    }
    canDefend(): boolean {
        const p = this.profile();
        return [p.armour, p.shield, p.pointDefense].some(n => n > 0);
    }
    isPlayable(match: Match, playerNo: number): boolean {
        const player = match.players[playerNo];
        return player.actionPool.hasActionFor(this.type)
            && (this.playableOutsideBuildPhase || (playerNo == match.activePlayerNo && match.turnPhase == TurnPhase.Build))
            && this.filterValidAttachTargets(match.players[playerNo].cardStacks).length > 0;
    }
    abstract profile(): CardProfile
    actionPool(): ActionPool {
        return new ActionPool();
    }
}
