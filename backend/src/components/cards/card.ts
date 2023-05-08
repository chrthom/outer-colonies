import CardStack from './card_stack';
import CardProfile from './card_profile';
import Match from '../game_state/match';
import { CardType, TurnPhase } from '../config/enums';

export default abstract class Card {
    readonly id!: number;
    readonly name!: string;
    readonly type!: CardType;
    playableOutsideBuildPhase: boolean = false;
    constructor(id: number, name: string, type: CardType) {
        this.id = id;
        this.name = name;
        this.type = type;
    }
    abstract canBeAttachedTo(cardStacks: Array<CardStack>): Array<CardStack>
    abstract canBeAttachedToColony(cardStacks: Array<CardStack>): boolean
    isPlayable(match: Match, playerNo: number): boolean {
        const player = match.players[playerNo];
        return player.remainingActions[this.type] > 0 
            && (this.playableOutsideBuildPhase || (playerNo == match.activePlayerNo && match.turnPhase == TurnPhase.Build))
            && this.isPlayableDecorator(match, playerNo);
    }
    protected abstract isPlayableDecorator(match: Match, playerNo: number): boolean
    abstract profile(): CardProfile
}