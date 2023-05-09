import Player from './player';
import { rules } from '../config/rules';
import { TurnPhase } from '../config/enums'
import Battle, { BattleNone } from './battle';

export default class Match {
    readonly room!: string;
    players: Array<Player> = [];
    activePlayerNo = 0;
    turnPhase = TurnPhase.Init;
    battle!: Battle;
    constructor(room: string) {
        this.room = room;
        this.battle = new BattleNone();
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
        this.activePlayerNo = this.activePlayerNo == 0 ? 1 : 0;
        this.turnPhase = TurnPhase.Start;
        this.getActivePlayer().resetRemainingActions();
        // TODO: Move ships from neutral zone to orbital zone
        this.getActivePlayer().drawCards(rules.cardsToDrawPerTurn);
        // TODO: Check if no cards are left in deck
        // TODO: Check for effects on drawing a cards (like drawing an extra card)
        // TODO: Execute start of turn effects of cards
    }
    prepareBuildPhase() {
        this.turnPhase = TurnPhase.Build;
    }
    preparePlanPhase() {
        this.turnPhase = TurnPhase.Plan;
        this.battle = new BattleNone();
        if (!this.getActivePlayer().cardStacks.some(cs => cs.isMissionReady()))
            this.prepareEndPhase();
    }
    prepareCombatPhase() {
        this.turnPhase = TurnPhase.Combat;
        // TODO: CONTINUE HERE!!!
    }
    prepareEndPhase() {
        this.turnPhase = TurnPhase.End;
    }
}