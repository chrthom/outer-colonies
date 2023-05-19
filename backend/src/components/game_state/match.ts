import Player from './player';
import { rules } from '../config/rules';
import { BattleType, TurnPhase, Zone } from '../config/enums'
import Battle from './battle';
import toBattle, { FrontendPlannedBattle } from '../frontend_converters/frontend_planned_battle';
import EquipmentCard from '../cards/types/equipmentCard';

export default class Match {
    readonly room!: string;
    players: Array<Player> = [];
    activePlayerNo = 0;
    actionPendingByPlayerNo = 0;
    turnPhase = TurnPhase.Init;
    battle: Battle;
    constructor(room: string) {
        this.room = room;
    }
    matchName(): string {
        return this.players[0].name + ' vs. ' + this.players[1].name;
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
    prepareStartPhase() { // TODO: Return Event to send to player
        this.activePlayerNo = this.opponentPlayerNo(this.activePlayerNo);
        this.actionPendingByPlayerNo = this.activePlayerNo;
        this.turnPhase = TurnPhase.Start;
        this.getActivePlayer().resetRemainingActions();
        this.battle = new Battle(BattleType.None);
        // TODO: Move ships from neutral zone to orbital zone
        this.getActivePlayer().drawCards(rules.cardsToDrawPerTurn);
        // TODO: Check for effects on drawing a cards (like drawing an extra card)
        // TODO: Execute start of turn effects of cards
        // TODO: Wait for response to continue
        this.prepareBuildPhase();
    }
    prepareBuildPhase() {
        this.turnPhase = TurnPhase.Build;
    }
    prepareBuildPhaseReaction(plannedBattle: FrontendPlannedBattle) {
        this.battle = toBattle(this, plannedBattle);
        if (this.battle.type == BattleType.None) {
            this.prepareEndPhase();
        } else {
            this.battle.ships[this.actionPendingByPlayerNo].forEach(cs => cs.zone = Zone.Neutral);
            this.actionPendingByPlayerNo = this.opponentPlayerNo(this.activePlayerNo);
        }
    }
    prepareCombatPhase(interveningShipIds: Array<string>) {
        this.turnPhase = TurnPhase.Combat;
        this.battle.assignInterveningShips(this.getInactivePlayer(), interveningShipIds);
        this.processBattleRound();
    }
    processBattleRound() {
        if (this.actionPendingByPlayerNo == this.opponentPlayerNo(this.activePlayerNo)) {
            //this.battle.missionShips.forEach() // CONTINUE HERE!
            // TODO: Remove destroyed ships
            this.battle.range--;
            this.forAllPlayers((playerNo: number) => this.players[playerNo].cardStacks.forEach(cs => cs.combatPhaseReset()));
        }
        this.actionPendingByPlayerNo = this.opponentPlayerNo(this.actionPendingByPlayerNo);
        if (this.battle.range == 0) {
            this.prepareEndPhase();
        } else {
            const activeShips = this.battle.ships[this.actionPendingByPlayerNo];
            const hasAttack = activeShips
                .flatMap(cs => cs.getCardStacks())
                .filter(cs => cs.attackAvailable)
                .some(cs => (<EquipmentCard> cs.card).attackProfile.range >= this.battle.range);
            if (!hasAttack) this.processBattleRound();
        }
    }
    prepareEndPhase() {
        this.turnPhase = TurnPhase.End;
    }
}