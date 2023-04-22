import { layout } from "../config.js";

export class Prompt {
    sprite;
    constructor(scene) {
        this.sprite = scene.add.text(layout.prompt.x, layout.prompt.y, [''])
            .setFontSize(layout.prompt.fontSize)
            .setFontFamily('Impact')
            .setColor('#eeeeaa')
            .setAlign('right')
            .setOrigin(1, 0);
        this.hide();
    }
    showBuildPhase(remainingActions) {
        this.show(
            'Aufbauphase: Spiele Karten\n'
                + `- ${remainingActions.hull}x Hülle\n`
                + `- ${remainingActions.equipment}x Ausrüstung\n`
                + `- ${remainingActions.colony}x Kolonie\n`
                + `- ${remainingActions.tactic}x Taktik`
        );
    }
    showPlanPhase() {
        this.show('Planungsphase: Plane Missionen und Überfälle');
    }
    show(text) {
        this.sprite.setText(text);
        this.sprite.visible = true;
    }
    hide() {
        this.sprite.visible = false;
    }
}