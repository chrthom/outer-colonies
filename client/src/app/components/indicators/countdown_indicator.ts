import { designConfig } from 'src/app/config/design';
import { Coordinates, layoutConfig } from 'src/app/config/layout';
import Game from 'src/app/scenes/game';

export default class CountdownIndicator {
  private scene: Game;
  private text: Phaser.GameObjects.Text;
  private ownedByPlayer: boolean;
  constructor(scene: Game, ownedByPlayer: boolean) {
    this.scene = scene;
    this.ownedByPlayer = ownedByPlayer;
    const countdownLayout = layoutConfig.game.ui.countdownIndicator;
    const coordinates: Coordinates = ownedByPlayer ? countdownLayout.player : countdownLayout.opponent;
    this.text = this.scene.add
      .text(coordinates.x, coordinates.y, '')
      .setFontSize(layoutConfig.fontSize.normal)
      .setFontFamily(designConfig.fontFamily.caption)
      .setColor(designConfig.color.neutral)
      .setAlign('right')
      .setOrigin(1, 0.5);
  }
  update(countdown?: number) {
    const playerData = this.ownedByPlayer ? this.scene.state.player : this.scene.state.opponent;
    this.text.setText(`${countdown ? this.formatCountdown(countdown) : ''}  ${playerData.name}`);
    this.text.setColor(countdown && countdown < 60 ? designConfig.color.warn : designConfig.color.neutral);
  }
  private formatCountdown(countdown: number): string {
    return `[${this.twoDigit(Math.floor(countdown / 60))}:${this.twoDigit(countdown % 60)}]`;
  }
  private twoDigit(n: number): string {
    return `0${n}`.slice(-2);
  }
}
