import { BattleType, TurnPhase } from "../../../backend/src/components/config/enums";
import Layout from "../config/layout";
import Game from "../scenes/game";

const layout = new Layout();

export default class Prompt {
    sprite: Phaser.GameObjects.Text;
    constructor(scene) {
        this.sprite = scene.add.text(layout.prompt.x, layout.prompt.y, [''])
            .setFontSize(layout.prompt.fontSize)
            .setFontFamily('Impact')
            .setColor('#eeeeaa')
            .setAlign('right')
            .setOrigin(1, 0);
        this.hide();
    }
    update(scene: Game) {
        if (scene.state.playerPendingAction) {
            if (scene.state.turnPhase == TurnPhase.Build) {
                this.showBuildPhase(scene);
            } else {
                this.hide();
            }
        } else {
            this.hide();
        }
    }
    private showBuildPhase(scene: Game) {
        const actions = scene.state.remainingActions;
        const actionText = `Aktionen: ${actions.hull}H ${actions.equipment}A ${actions.colony}C ${actions.tactic}T`;
        let battleText: string;
        if (scene.plannedBattle.type == BattleType.None)
            battleText = 'Plane eine Mission oder einen Überfall:\n'
                + '- Klicke dein Deck für eine Mission\n'
                + '- Klicke die gegnerische Kolonie für einen Überfall';
        else battleText = `Wähle Schiffe für ${scene.plannedBattle.type == BattleType.Raid ? 'den Überfall' : 'die Mission'}`;
        this.show(`${actionText}\n${battleText}`);
    }
    private show(text: string) {
        this.sprite.setText(text);
        this.sprite.visible = true;
    }
    private hide() {
        this.sprite.visible = false;
    }
}