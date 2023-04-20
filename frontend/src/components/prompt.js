import { layout } from "../config";

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
    showText(text) {
        this.sprite.setText(text);
        this.sprite.visible = true;
    }
    hide() {
        this.sprite.visible = false;
    }
}