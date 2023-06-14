import Player from './player';
import { rules } from '../config/rules';
import { BattleType, TurnPhase } from '../config/enums'
import Battle from './battle';
import { FrontendPlannedBattle } from '../frontend_converters/frontend_planned_battle';55
import CardStack from '../cards/card_stack';
import { opponentPlayerNo } from '../utils/utils';
import CardEvent from '../cards/card_event';

export default class Match {
    readonly room!: string;
    players: Player[] = [];
    activePlayerNo: number = 0;
    actionPendingByPlayerNo: number = 0;
    turnPhase!: TurnPhase;
    battle: Battle;
    eventBuffer: CardEvent[] = [];
    gameResult!: GameResult;
    constructor(room: string) {
        this.room = room;
        this.turnPhase = TurnPhase.Init;
        this.gameResult = new GameResult();
    }
    getActivePlayer(): Player {
        return this.players[this.activePlayerNo];
    }
    getInactivePlayer(): Player {
        return this.players[this.getInactivePlayerNo()];
    }
    getInactivePlayerNo(): number {
        return opponentPlayerNo(this.activePlayerNo);
    }
    getInPlayCardStacks(): CardStack[] {
        return this.players.flatMap(p => p.cardStacks);
    }
    getPendingActionPlayer(): Player {
        return this.players[this.actionPendingByPlayerNo];
    }
    getWaitingPlayer(): Player {
        return this.players[this.getWaitingPlayerNo()];
    }
    getWaitingPlayerNo(): number {
        return opponentPlayerNo(this.actionPendingByPlayerNo);
    }
    forAllPlayers(f: (playerNo: number) => void) {
        f(0);
        f(1);
    }
    setStartPlayer() {
        if (this.players[0].deck.length > this.players[1].deck.length) this.activePlayerNo = 0;
        else if (this.players[0].deck.length < this.players[1].deck.length) this.activePlayerNo = 1;
        else this.activePlayerNo = Math.round(Math.random());
    }
    prepareStartPhase() {
        this.activePlayerNo = opponentPlayerNo(this.activePlayerNo);
        this.actionPendingByPlayerNo = this.activePlayerNo;
        this.turnPhase = TurnPhase.Start;
        this.battle = new Battle(BattleType.None);
        this.getActivePlayer().resetRemainingActions();
        this.getActivePlayer().callBackShipsFromNeutralZone();
        this.getActivePlayer().drawCards(rules.cardsToDrawPerTurn);
        // ISSUE #32: Check for effects on drawing a cards (like drawing an extra card) and execute start of turn effects of cards
        // + Wait for response to continue
        this.prepareBuildPhase();
    }
    prepareBuildPhase() {
        this.turnPhase = TurnPhase.Build;
    }
    prepareBuildPhaseReaction(plannedBattle: FrontendPlannedBattle) {
        this.battle = Battle.fromFrontendPlannedBattle(this, plannedBattle);
        if (this.battle.type == BattleType.None) this.prepareEndPhase();
        else this.actionPendingByPlayerNo = opponentPlayerNo(this.activePlayerNo);
    }
    prepareCombatPhase(interveningShipIds: string[]) {
        this.turnPhase = TurnPhase.Combat;
        this.battle.assignInterveningShips(this.getInactivePlayer(), interveningShipIds);
        this.players.forEach(player => {
            player.cardStacks.forEach(cs => cs.combatPhaseReset(true));
        });
        this.processBattleRound();
    }
    prepareEndPhase() {
        this.turnPhase = TurnPhase.End;
        this.actionPendingByPlayerNo = this.activePlayerNo;
        this.battle = new Battle(BattleType.None);
        this.getActivePlayer().moveFlightReadyShipsToOrbit();
        if (this.getActivePlayer().hand.length <= this.getActivePlayer().handCardLimit() && !this.gameResult.gameOver) {
            this.prepareStartPhase();
        }
    }
    processBattleRound() {
        this.battle.processBattleRound(this);
    }
}

export class GameResult {
    gameOver: boolean = false;
    winnerNo: number;
    setWinnerByDestruction(destroyedPlayer: Player) {
        this.gameOver = true;
        this.winnerNo = opponentPlayerNo(destroyedPlayer.no);
    }
    setWinnerByDeckDepletion(depletedPlayer: Player) {
        this.gameOver = true;
        this.winnerNo = opponentPlayerNo(depletedPlayer.no);
    }
}
