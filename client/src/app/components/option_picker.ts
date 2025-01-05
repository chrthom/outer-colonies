import { designConfig } from '../config/design';
import { layoutConfig } from '../config/layout';
import { perspectiveConfig } from '../config/perspective';
import Game from '../scenes/game';
import CardImage from './card/card_image';
import { ZoomCardXPosition, ZoomCardYPosition } from './perspective';

export default class OptionPicker {
  private scene: Game;
  private backgroundOverlay: Phaser.GameObjects.Rectangle;
  private cards: CardImage[];
  private text: Phaser.GameObjects.Text;
  private selectedOptions: number[] = [];
  private readonly optionsToSelect: number;
  constructor(scene: Game, options: number[], optionsToSelect: number) {
    this.scene = scene;
    this.optionsToSelect = optionsToSelect;
    this.backgroundOverlay = this.scene.add
      .rectangle(0, 0, layoutConfig.scene.width, layoutConfig.scene.height, designConfig.tint.dark, 0)
      .setDepth(layoutConfig.depth.optionsPicker);
    this.text = this.scene.add
      .text(layoutConfig.scene.width / 2, 200 /* TODO: Move to layout constant */, this.selectedOptionsText)
      .setFontSize(layoutConfig.fontSize.large)
      .setFontFamily(designConfig.fontFamily.caption)
      .setColor(designConfig.color.neutral)
      .setDepth(layoutConfig.depth.optionsPicker)
      .setOrigin(0.5);
    this.cards = options.map((cardId, index) =>
      new CardImage(
        this.scene,
        new ZoomCardXPosition(250 + index * 500), // TODO: Move to layout constants
        new ZoomCardYPosition(layoutConfig.scene.height / 2),
        cardId,
        {
          perspective: layoutConfig.game.cards.perspective.none,
          z: perspectiveConfig.distance.near
        }
      ).setDepth(layoutConfig.depth.optionsPicker)
    );
  }
  private get selectedOptionsText(): string {
    return `${this.selectedOptions}/${this.optionsToSelect} Karten ausgewählt`;
  }
}
