import { layout } from "../config/layout";
import Game from "../scenes/game";

export default class Preloader {
    progressBar!: Phaser.GameObjects.Graphics;
    progressBox!: Phaser.GameObjects.Graphics;
    text!: Phaser.GameObjects.Text;
    constructor(scene: Game) {
        const self = this;
        this.progressBar = scene.add.graphics();
        this.progressBox = scene.add.graphics()
            .fillStyle(layout.colors.primary, layout.colors.fadedAlpha)
            .fillRect(
                layout.preloader.x - layout.preloader.width / 2 - layout.preloader.boxPadding,
                layout.preloader.y - layout.preloader.boxPadding,
                layout.preloader.width + 2 * layout.preloader.boxPadding,
                layout.preloader.height + 2 * layout.preloader.boxPadding
            );
        this.text = scene.add.text(layout.preloader.x, layout.preloader.y + layout.preloader.textOffsetY, 'Lade Spieldaten...')
            .setFontSize(layout.prompt.fontSize) // TODO: Change
            .setFontFamily(layout.font.family)
            .setColor(layout.font.color)
            .setOrigin(0.5, 0.5);
        scene.load.on('progress', (value: number) => {
            self.progressBar.clear()
                .fillStyle(layout.colors.primary, layout.colors.alpha)
                .fillRect(
                    layout.preloader.x - layout.preloader.width / 2,
                    layout.preloader.y,
                    layout.preloader.width * value,
                    layout.preloader.height
                );
        });
        scene.load.on('complete', () => {
            console.log('Ready to play');
            this.text.setText('Warte auf Gegenspieler...');
        });
    }
    destroy() {
        this.progressBar.destroy();
        this.progressBox.destroy();
        this.text.destroy();
    }
}