import Player from './player';
import { rules } from '../config/rules';
import { BattleType, TurnPhase, Zone } from '../config/enums'
import Battle from './battle';
import { FrontendPlannedBattle } from '../frontend_converters/frontend_planned_battle';55
import CardStack from '../cards/card_stack';

export default class Match {
    readonly room!: string;
    players: Player[] = [];
    activePlayerNo = 0;
    actionPendingByPlayerNo = 0;
    turnPhase = TurnPhase.Init;
    battle: Battle;
    constructor(room: string) {
        this.room = room;
    }
    opponentPlayerNo(playerNo: number): number {
        return playerNo == 0 ? 1 : 0;
    }
    getActivePlayer(): Player {
        return this.players[this.activePlayerNo];
    }
    getInactivePlayer(): Player {
        return this.players[this.getInactivePlayerNo()];
    }
    getInactivePlayerNo(): number {
        return this.opponentPlayerNo(this.activePlayerNo);
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
        return this.opponentPlayerNo(this.actionPendingByPlayerNo);
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
        this.activePlayerNo = this.opponentPlayerNo(this.activePlayerNo);
        this.actionPendingByPlayerNo = this.activePlayerNo;
        this.turnPhase = TurnPhase.Start;
        this.battle = new Battle(BattleType.None);
        this.getActivePlayer().resetRemainingActions();
        this.getActivePlayer().callBackShipsFromNeutralZone();
        this.getActivePlayer().drawCards(rules.cardsToDrawPerTurn);
        // FEATURE: Check for effects on drawing a cards (like drawing an extra card) and execute start of turn effects of cards
        // + Wait for response to continue
        this.prepareBuildPhase();
    }
    prepareBuildPhase() {
        this.turnPhase = TurnPhase.Build;
    }
    prepareBuildPhaseReaction(plannedBattle: FrontendPlannedBattle) {
        this.battle = Battle.fromFrontendPlannedBattle(this, plannedBattle);
        if (this.battle.type == BattleType.None) this.prepareEndPhase();
        else this.actionPendingByPlayerNo = this.opponentPlayerNo(this.activePlayerNo);
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
        this.getActivePlayer().moveFlightReadyShipsToOrbit();
        // TODO: Check if enemy colony is destroyed
        if (this.getActivePlayer().hand.length <= this.getActivePlayer().handCardLimit()) this.prepareStartPhase();
    }
    processBattleRound() {
        this.battle.processBattleRound(this);
    }
}