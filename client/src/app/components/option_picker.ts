import { designConfig } from "../config/design";
import { layoutConfig } from "../config/layout";
import Game from "../scenes/game";
import CardImage from "./card/card_image";

export default class OptionPicker {
  private scene: Game;
  private backgroundOverlay: Phaser.GameObjects.Rectangle;
  private cards: CardImage;
  constructor(scene: Game, options: number[]) {
    this.scene = scene;
    this.backgroundOverlay = this.scene.add
      .rectangle(
        0, 
        0, 
        layoutConfig.scene.width,
        layoutConfig.scene.height,
        designConfig.tint.dark,
        0
      )
      .setDepth(layoutConfig.depth.optionsPicker);
    this.cards = options
      .map(o => new CardImage(this.scene, )) // TODO: Continue here
  }
}