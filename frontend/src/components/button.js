export class Button {
    sprite;
    action = {
        onClick: null
    };
    constructor(scene) {
        const self = this;
        this.sprite = scene.add.text(1300, 20, [''])
            .setAlign('right')
            .setFontSize(18)
            .setFontFamily('Impact')
            .setColor('#eeeeaa')
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
    show(text, onClickAction) {
        this.action.onClick = onClickAction;
        this.sprite.setText(text);
        this.sprite.visible = true;
    }
    hide() {
        this.sprite.visible = false;
    }
}