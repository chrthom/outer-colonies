import { TurnPhase } from "../../../backend/src/components/config/enums";
import Layout from "../config/layout";
import Game from "../scenes/game";

const layout = new Layout();

export default class Button {
    sprite: Phaser.GameObjects.Text;
    action = {
        onClick: null
    };
    constructor(scene: Game) {
        const self = this;
        this.sprite = scene.add.text(layout.continueButton.x, layout.continueButton.y, [''])
            .setFontSize(layout.continueButton.fontSize)
            .setFontFamily('Impact')
            .setColor('#eeeeaa')
            .setAlign('right')
            .setOrigin(1, 0)
            .setInteractive();
        this.sprite.on('pointerdown', () => {
            self.action.onClick();
        });
        this.sprite.on('pointerover', () => {
            self.sprite.setColor('#ff69b4');
        });
        this.sprite.on('pointerout', () => {
            self.sprite.setColor('#eeeeaa');
        });
        this.hide();
    }
    showPhase(phase: TurnPhase, onClickAction: () => void) {
        let phaseName: string;
        switch (phase) {
            case TurnPhase.Build: phaseName = 'Aufbauphase'; break;
            case TurnPhase.Plan: phaseName = 'Planungsphase'; break;
        }
        this.show(`${phaseName} beenden`, onClickAction);
    }
    show(text: string, onClickAction: () => void) {
        this.action.onClick = onClickAction;
        this.sprite.setText(text);
        this.sprite.visible = true;
    }
    hide() {
        this.sprite.visible = false;
    }
}