import { BattleType, TurnPhase } from "../../../backend/src/components/config/enums";
import { FrontendPlannedBattle } from "../../../backend/src/components/frontend_converters/frontend_planned_battle";
import { FrontendGameResult } from "../../../backend/src/components/frontend_converters/frontend_state";
import { layout } from "../config/layout";
import Game from "../scenes/game";

export default class Prompt {
    private scene: Game;
    private text: Phaser.GameObjects.Text;
    constructor(scene: Game) {
        this.scene = scene;
        this.text = scene.add.text(layout.prompt.x, layout.prompt.y, '')
            .setFontSize(layout.prompt.fontSize)
            .setFontFamily(layout.font.family)
            .setColor(layout.font.color)
            .setAlign('right')
            .setOrigin(1, 0);
        this.hide();
    }
    update() {
        if (this.scene.state.gameResult) {
            this.showGameOver(this.scene.state.gameResult);
        } else if (this.scene.state.playerPendingAction) {
            switch (this.scene.state.turnPhase) {
                case TurnPhase.Build:
                    if (this.scene.state.playerIsActive) this.showBuildPhase();
                    else this.showIntervenePhase();
                    break;
                case TurnPhase.Combat:
                    this.showCombatPhase();
                    break;
                case TurnPhase.End:
                    this.showEndPhase();
                    break;
                default:
                    this.hide();
            }
        } else {
            this.hide();
        }
    }
    private showBuildPhase() {
        let text: string = '';
        if (this.scene.plannedBattle.type == BattleType.None) {
            if (this.scene.state.hasToRetractCards) {
                text += 'Einige deiner Karten haben nicht genügend Energie.\n Nehme sie auf die Hand zurück!\n';
            }
            text += 'Plane eine Mission oder einen Überfall:\n'
                + '- Klicke dein Deck oder Ablagestapel für eine Mission\n'
                + '- Klicke die gegnerische Kolonie für einen Überfall';
        } else if (this.scene.plannedBattle.type == BattleType.Mission && !FrontendPlannedBattle.cardLimitReached(this.scene.plannedBattle)) {
            const missingCards = FrontendPlannedBattle.missingCards(this.scene.plannedBattle);
            text += `Wähle ${missingCards} weitere Missionskarte${missingCards == 1 ? '' : 'n'}`;
        } else {
            text += `Wähle Schiffe für ${this.scene.plannedBattle.type == BattleType.Raid ? 'den Überfall' : 'die Mission'}`;
        }
        this.show(text);
    }
    private showIntervenePhase() {
        const battleText = this.scene.state.battle.type == BattleType.Raid ? 'Verteidigung deiner Kolonie' : 'Intervention der gegenerischen Mission';
        this.show(`Wähle Schiffe zur ${battleText}`)
    }
    private showCombatPhase() {
        this.show(`Aktuelle Reichweite der Gefechts: ${this.scene.state.battle.range}\nFühre Angriffe mit deinen Waffensystemen durch`);
    }
    private showEndPhase() {
        const cardsToDrop = this.scene.state.hand.length - this.scene.state.handCardLimit;
        this.show(`Handkartenlimit um ${cardsToDrop} überschritten;\nLege überzählige Karten ab!`);
    }
    private showGameOver(gameResult: FrontendGameResult) {
        this.show(`GAME OVER: Du hast das Spiel ${gameResult.won ? 'gewonnen' : 'verloren'}!`);
    }
    private show(text: string) {
        this.text.setText(text);
        this.text.visible = true;
    }
    private hide() {
        this.text.visible = false;
    }
}