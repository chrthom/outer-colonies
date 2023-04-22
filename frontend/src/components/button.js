import { layout } from "../config.js";

export class Button {
    sprite;
    action = {
        onClick: null
    };
    constructor(scene) {
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
            self.sprite.setColor('#ff69b4');fälle
        });
        this.sprite.on('pointerout', () => {
            self.sprite.setColor('#eeeeaa');
        });
        this.hide();
    }
    showBuildPhase(onClickAction) {
        this.show('Aufbauphase beenden', onClickAction);
    }
    showPlanPhase(onClickAction) {
        this.show('Planungsphase beenden', onClickAction);
    }
    show(text, onClickAction) {
        this.action.onClick = onClickAction;
        this.sprite.setText(text);
        this.sprite.visible = true;
    }
    hide() {
        this.sprite.visible = false;
    }
}