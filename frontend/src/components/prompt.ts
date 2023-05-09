import { BattleType } from "../../../backend/src/components/config/enums";
import { FrontendPlannedBattle } from "../../../backend/src/components/frontend_converters/frontend_planned_battle";
import { FrontendActions } from "../../../backend/src/components/frontend_converters/frontend_state";
import Layout from "../config/layout";

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
    showBuildPhase(remainingActions: FrontendActions) {
        this.show(
            'Spiele Karten\n'
                + `- ${remainingActions.hull}x Hülle\n`
                + `- ${remainingActions.equipment}x Ausrüstung\n`
                + `- ${remainingActions.colony}x Kolonie\n`
                + `- ${remainingActions.tactic}x Taktik`
        );
    }
    showPlanPhase(plannedBattle: FrontendPlannedBattle) {
        let actionText: string;
        if (plannedBattle.type == BattleType.None)
            actionText = 'Plane eine Mission oder einen Überfall.\n'
                + '- Klicke dein Deck für eine Mission\n'
                + '- Klicke die gegnerische Kolonie für einen Überfall';
        else actionText = `Wähle Schiffe für ${plannedBattle.type == BattleType.Raid ? 'den Überfall' : 'die Mission'}`;
        this.show(actionText);
    }
    show(text: string) {
        this.sprite.setText(text);
        this.sprite.visible = true;
    }
    hide() {
        this.sprite.visible = false;
    }
}