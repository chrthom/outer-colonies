import Layout from "../config/layout";
import Game from "../scenes/game";

const layout = new Layout();

export class Button {
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
    showBuildPhase(onClickAction: () => void) {
        this.show('Aufbauphase beenden', onClickAction);
    }
    showPlanPhase(onClickAction: () => void) {
        this.show('Planungsphase beenden', onClickAction);
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