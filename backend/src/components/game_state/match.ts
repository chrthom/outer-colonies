import Player from './player';
import { rules } from '../config/rules';
import { BattleType, TurnPhase, Zone } from '../config/enums'
import Battle from './battle';
import toBattle, { FrontendPlannedBattle } from '../frontend_converters/frontend_planned_battle';

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
        // TODO: Check if no cards are left in deck
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
            this.battle.missionShips.forEach(cs => cs.zone = Zone.Neutral);
            this.actionPendingByPlayerNo = this.opponentPlayerNo(this.activePlayerNo);
        }
    }
    prepareCombatPhase() {
        this.turnPhase = TurnPhase.Combat;
        this.actionPendingByPlayerNo = this.activePlayerNo;
        // TODO: CONTINUE HERE!!!
    }
    prepareEndPhase() {
        this.turnPhase = TurnPhase.End;
    }
}