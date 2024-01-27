import { layoutConfig } from 'src/app/config/layout';
import Game from 'src/app/scenes/game';

export default class CountdownIndicator {
  private scene!: Game;
  private text!: Phaser.GameObjects.Text;
  constructor(scene: Game) {
    this.scene = scene;
    this.text = this.scene.add
      .text(layoutConfig.countdownIndicator.x, layoutConfig.countdownIndicator.y, '')
      .setFontSize(layoutConfig.exitButton.fontSize)
      .setFontFamily(layoutConfig.font.captionFamily)
      .setColor(layoutConfig.font.color)
      .setAlign('right')
      .setOrigin(1, 0.5);
  }
  update(playerCountdown: number, opponentCountdown: number) {
    const state = this.scene.state;
    this.text.setText(`
      ${state?.opponent.name} ${this.formatCountdown(opponentCountdown)}\n
      ${state?.name} ${this.formatCountdown(playerCountdown)}
    `);
    if (playerCountdown < 120 || opponentCountdown < 120) {
      this.text.setColor(layoutConfig.font.colorWarn);
    }
  }
  private formatCountdown(countdown: number): string {
    return `${this.twoDigit(Math.floor(countdown / 60))}:${this.twoDigit(countdown % 60)}`;
  }
  private twoDigit(n: number): string {
    return `0${n}`.slice(-2);
  }
}
