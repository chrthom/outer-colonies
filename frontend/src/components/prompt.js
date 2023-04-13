export class Prompt {
    sprite;
    constructor(scene) {
        this.sprite = scene.add.text(20, 20, ['']).setFontSize(18).setFontFamily('Impact').setColor('#eeeeaa');
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