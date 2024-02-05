import { designConfig } from 'src/app/config/design';
import { layoutConfig } from 'src/app/config/layout';
import Game from 'src/app/scenes/game';

export default class CountdownIndicator {
  private scene: Game;
  private text: Phaser.GameObjects.Text;
  private opponent: boolean;
  constructor(scene: Game, ownedByPlayer: boolean) {
    this.scene = scene;
    this.opponent = ownedByPlayer;
    this.text = this.scene.add
      .text(layoutConfig.game.ui.countdownIndicator.x, layoutConfig.game.ui.countdownIndicator.y, '')
      .setFontSize(layoutConfig.fontSize.normal)
      .setFontFamily(designConfig.fontFamily.caption)
      .setColor(designConfig.color.neutral)
      .setAlign('right')
      .setOrigin(1, 0.5);
  }
  update(playerCountdown: number) {
    const playerData = this.opponent ? this.scene.state.player : this.scene.state.opponent;
    this.text.setText(`
      ${playerData.name} ${this.formatCountdown(playerCountdown)}
    `);
    if (playerCountdown < 120) {
      this.text.setColor(designConfig.color.warn);
    }
  }
  private formatCountdown(countdown: number): string {
    return `${this.twoDigit(Math.floor(countdown / 60))}:${this.twoDigit(countdown % 60)}`;
  }
  private twoDigit(n: number): string {
    return `0${n}`.slice(-2);
  }
}
