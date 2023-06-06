import { BattleType, TurnPhase } from "../../../backend/src/components/config/enums";
import { rules } from "../../../backend/src/components/config/rules";
import Layout from "../config/layout";
import Game from "../scenes/game";

const layout = new Layout();

export default class Prompt {
    sprite: Phaser.GameObjects.Text;
    constructor(scene) {
        this.sprite = scene.add.text(layout.prompt.x, layout.prompt.y, '')
            .setFontSize(layout.prompt.fontSize)
            .setFontFamily('Impact')
            .setColor('#eeeeaa')
            .setAlign('right')
            .setOrigin(1, 0);
        this.hide();
    }
    update(scene: Game) {
        if (scene.state.playerPendingAction) {
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
        let battleText: string;
        if (scene.plannedBattle.type == BattleType.None)
            battleText = 'Plane eine Mission oder einen Überfall:\n'
                + '- Klicke dein Deck für eine Mission\n'
                + '- Klicke die gegnerische Kolonie für einen Überfall';
        else battleText = `Wähle Schiffe für ${scene.plannedBattle.type == BattleType.Raid ? 'den Überfall' : 'die Mission'}`;
        this.show(battleText);
    }
    private showIntervenePhase(scene: Game) {
        const battleText = scene.state.battle.type == BattleType.Raid ? 'Verteidigung deiner Kolonie' : 'Intervention der gegenerischen Mission';
        this.show(`Wähle Schiffe zur ${battleText}`)
    }
    private showCombatPhase(scene: Game) {
        this.show(`Aktuelle Reichweite der Gefechts: ${scene.state.battle.range}\nFühre Angriffe mit deinen Waffensystemen durch`);
    }
    private showEndPhase(scene: Game) {
        const cardsToDrop = scene.state.hand.length - rules.maxHandCards;
        this.show(`Handkartenlimit um ${cardsToDrop} überschritten;\nLege überzählige Karten ab!`);
    }
    private show(text: string) {
        this.sprite.setText(text);
        this.sprite.visible = true;
    }
    private hide() {
        this.sprite.visible = false;
    }
}