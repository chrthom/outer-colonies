import { environment } from "../../config/environment";
import { layout } from "../../config/layout";
import Game from "../../scenes/game";

export default class ExitButton {
    private scene!: Game;
    private image!: Phaser.GameObjects.Image;
    private text: Phaser.GameObjects.Text;
    constructor(scene: Game) {
        this.scene = scene;
        const self = this;
        this.text = scene.add.text(
            layout.exitButton.x + layout.exitButton.xTextOffset,
            layout.exitButton.y + layout.exitButton.yTextOffset,
            [ 'Aufgeben' ]
        )
            .setFontSize(layout.exitButton.fontSize)
            .setFontFamily(layout.font.captionFamily)
            .setColor(layout.font.color)
            .setAlign('right')
            .setOrigin(1, 0.5)
            .setInteractive();
        this.image = this.scene.add
            .image(layout.exitButton.x, layout.exitButton.y, 'icon_exit')
            .setOrigin(0.5, 0.5)
            .setInteractive();
        (<Phaser.GameObjects.GameObject[]> [ this.text, this.image ])
            .forEach(o => o
                .on('pointerdown', () => {
                    self.onClickAction();
                })
                .on('pointerover', () => {
                    self.text.setColor(layout.font.colorWarn);
                })
                .on('pointerout', () => {
                    self.text.setColor(layout.font.color);
                })
            );
    }
    update() {
        if (this.scene.state.gameResult) this.text.setText('Spiel beenden');
    }
    private onClickAction() {
        window.location.href = environment.urls.website;
    }
}