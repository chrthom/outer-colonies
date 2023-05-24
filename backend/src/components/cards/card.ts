import CardStack from './card_stack';
import CardProfile from './card_profile';
import { CardType, TurnPhase } from '../config/enums';
import ActionPool from './action_pool';
import Player from '../game_state/player';

export default abstract class Card {
    readonly id!: number;
    readonly name!: string;
    readonly type!: CardType;
    readonly rarity!: number;
    playableOutsideBuildPhase: boolean = false;
    doesRechargeBetweenCombatPhases: boolean = false;
    staysInPlay: boolean = true;
    constructor(id: number, name: string, type: CardType, rarity: number) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.rarity = rarity;
    }
    abstract getValidTargets(player: Player): CardStack[]
    abstract immediateEffect(player: Player, target: CardStack): void
    attack(attackingShip: CardStack, target: CardStack) {}
    canAttack(): boolean {
        return false;
    }
    canDefend(): boolean {
        const p = this.profile();
        return [p.armour, p.shield, p.pointDefense].some(n => n > 0);
    }
    isInRange(range: number): boolean {
        return false;
    }
    isPlayable(player: Player): boolean {
        return player.actionPool.hasActionFor(this.type)
            && (this.playableOutsideBuildPhase || (player.no == player.match.activePlayerNo && player.match.turnPhase == TurnPhase.Build))
            && this.getValidTargets(player).length > 0;
    }
    isFlightReady(cards: Card[]): boolean {
        return false;
    }
    abstract profile(): CardProfile
    actionPool(): ActionPool {
        return new ActionPool();
    }
}
