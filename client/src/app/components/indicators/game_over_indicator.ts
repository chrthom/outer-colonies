import { layoutConfig } from "src/app/config/layout";
import Game from "src/app/scenes/game";

export default class GameOverIndicator {
  private scene: Game;
  private image: Phaser.GameObjects.Image;
  constructor(scene: Game, won: boolean) {
    this.scene = scene;
    this.image = this.scene.add
      .image(layoutConfig.scene.width / 2, layoutConfig.scene.height / 2, `game_over_${won ? 'victory' : 'defeat'}`)
      .setOrigin(0.5);
  }
}