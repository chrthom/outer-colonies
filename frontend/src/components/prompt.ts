import { BattleType, TurnPhase } from "../../../backend/src/components/config/enums";
import { FrontendPlannedBattle } from "../../../backend/src/components/frontend_converters/frontend_planned_battle";
import { FrontendGameResult } from "../../../backend/src/components/frontend_converters/frontend_state";
import { layout } from "../config/layout";
import Game from "../scenes/game";

export default class Prompt {
    sprite: Phaser.GameObjects.Text;
    constructor(scene: Game) {
        this.sprite = scene.add.text(layout.prompt.x, layout.prompt.y, '')
            .setFontSize(layout.prompt.fontSize)
            .setFontFamily(layout.font.family)
            .setColor(layout.font.color)
            .setAlign('right')
            .setOrigin(1, 0);
        this.hide();
    }
    update(scene: Game) {
        if (scene.state.gameResult) {
            this.showGameOver(scene.state.gameResult);
        } else if (scene.state.playerPendingAction) {
            switch (scene.state.turnPhase) {
                case TurnPhase.Build:
                    if (scene.state.playerIsActive) this.showBuildPhase(scene);
                    else this.showIntervenePhase(scene);
                    break;
                case TurnPhase.Combat:
                    this.showCombatPhase(scene);
                    break;
                case TurnPhase.End:
                    this.showEndPhase(scene);
                    break;
                default:
                    this.hide();
            }
        } else {
            this.hide();
        }
    }
    private showBuildPhase(scene: Game) {
        let text: string = '';
        if (scene.plannedBattle.type == BattleType.None) {
            if (scene.state.hasToRetractCards) {
                text += 'Einige deiner Karten haben nicht genügend Energie.\n Nehme sie auf die Hand zurück!\n';
            }
            text += 'Plane eine Mission oder einen Überfall:\n'
                + '- Klicke dein Deck oder Ablagestapel für eine Mission\n'
                + '- Klicke die gegnerische Kolonie für einen Überfall';
        } else if (scene.plannedBattle.type == BattleType.Mission && !FrontendPlannedBattle.cardLimitReached(scene.plannedBattle)) {
            const missingCards = FrontendPlannedBattle.missingCards(scene.plannedBattle);
            text += `Wähle ${missingCards} weitere Missionskarte${missingCards == 1 ? '' : 'n'}`;
        } else {
            text += `Wähle Schiffe für ${scene.plannedBattle.type == BattleType.Raid ? 'den Überfall' : 'die Mission'}`;
        }
        this.show(text);
    }
    private showIntervenePhase(scene: Game) {
        const battleText = scene.state.battle.type == BattleType.Raid ? 'Verteidigung deiner Kolonie' : 'Intervention der gegenerischen Mission';
        this.show(`Wähle Schiffe zur ${battleText}`)
    }
    private showCombatPhase(scene: Game) {
        this.show(`Aktuelle Reichweite der Gefechts: ${scene.state.battle.range}\nFühre Angriffe mit deinen Waffensystemen durch`);
    }
    private showEndPhase(scene: Game) {
        const cardsToDrop = scene.state.hand.length - scene.state.handCardLimit;
        this.show(`Handkartenlimit um ${cardsToDrop} überschritten;\nLege überzählige Karten ab!`);
    }
    private showGameOver(gameResult: FrontendGameResult) {
        this.show(`GAME OVER: Du hast das Spiel ${gameResult.won ? 'gewonnen' : 'verloren'}!`);
    }
    private show(text: string) {
        this.sprite.setText(text);
        this.sprite.visible = true;
    }
    private hide() {
        this.sprite.visible = false;
    }
}