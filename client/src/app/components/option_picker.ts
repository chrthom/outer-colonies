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
  private confirmButton: Phaser.GameObjects.Text;
  private moveLeftButton: Phaser.GameObjects.Triangle;
  private moveRightButton: Phaser.GameObjects.Triangle;
  private optionsToSelect: number;
  private selectedOptions: number[] = [];
  private currentPage: number = 0;
  constructor(scene: Game, options: number[], optionsToSelect: number) {
    this.scene = scene;
    this.optionsToSelect = optionsToSelect;
    this.backgroundOverlay = this.scene.add
      .rectangle(
        0,
        0,
        layoutConfig.scene.width,
        layoutConfig.scene.height,
        designConfig.tint.dark,
        designConfig.alpha.faded
      )
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
    this.cards.forEach(c =>
      c.image.on('pointerdown', (p: Phaser.Input.Pointer) => {
        if (p.leftButtonDown()) this.onCardClick(c);
      })
    );
    this.moveLeftButton = this.scene.add
      .triangle(
        layoutConfig.scene.width - 50,
        layoutConfig.scene.height / 2,
        0,
        0,
        -30 /* TODO: Move to layout constant */,
        -50 /* TODO: Move to layout constant */,
        -30 /* TODO: Move to layout constant */,
        50 /* TODO: Move to layout constant */,
        designConfig.tint.player,
        designConfig.alpha.faded
      )
      .setDepth(layoutConfig.depth.optionsPicker)
      .setInteractive()
      .setVisible(this.hasPageLeft)
      .on('pointerdown', (p: Phaser.Input.Pointer) => {
        if (p.leftButtonDown()) this.moveLeft();
      });
    this.moveRightButton = this.scene.add
      .triangle(
        50 /* TODO: Move to layout constant */,
        layoutConfig.scene.height / 2,
        0,
        0,
        30 /* TODO: Move to layout constant */,
        -50 /* TODO: Move to layout constant */,
        30 /* TODO: Move to layout constant */,
        50 /* TODO: Move to layout constant */,
        designConfig.tint.player,
        designConfig.alpha.faded
      )
      .setDepth(layoutConfig.depth.optionsPicker)
      .setInteractive()
      .setVisible(this.hasPageRight)
      .on('pointerdown', (p: Phaser.Input.Pointer) => {
        if (p.leftButtonDown()) this.moveRight();
      });
    this.confirmButton = this.scene.add
      .text(
        layoutConfig.scene.width / 2,
        layoutConfig.scene.height - 200 /* TODO: Move to layout constant */,
        'OK'
      )
      .setFontSize(layoutConfig.fontSize.giant)
      .setFontFamily(designConfig.fontFamily.caption)
      .setColor(designConfig.color.neutral)
      .setDepth(layoutConfig.depth.optionsPicker)
      .setOrigin(0.5)
      .setInteractive()
      .setVisible(false)
      .on('pointerdown', (p: Phaser.Input.Pointer) => {
        if (p.leftButtonDown()) this.confirm();
      });
  }
  destroy() {
    [this.backgroundOverlay, this.text, this.confirmButton, this.moveLeftButton, this.moveRightButton].map(
      o => o.destroy()
    );
    this.cards.forEach(c => c.destroy());
  }
  private confirm() {
    if (this.allOptionsSelected) {
      // TODO
    }
  }
  private moveLeft() {
    if (this.hasPageLeft) {
      this.currentPage--;
      // TODO
    }
  }
  private moveRight() {
    if (this.hasPageRight) {
      this.currentPage++;
      // TODO
    }
  }
  private onCardClick(card: CardImage) {
    if (this.selectedOptions.includes(card.cardId)) {
      card.highlightReset();
      this.selectedOptions = this.selectedOptions.filter(c => c != card.cardId);
    } else if (!this.allOptionsSelected) {
      card.highlightSelected();
      this.selectedOptions.push(card.cardId);
    }
    this.updateTexts();
  }
  private updateTexts() {
    this.text.setText(this.selectedOptionsText);
    this.confirmButton.setVisible(this.allOptionsSelected);
  }
  private get selectedOptionsText(): string {
    return `${this.selectedOptions.length}/${this.optionsToSelect} Karten ausgewählt`;
  }
  private get allOptionsSelected(): boolean {
    return this.selectedOptions.length == this.optionsToSelect;
  }
  private get hasPageLeft(): boolean {
    return this.currentPage > 0;
  }
  private get hasPageRight(): boolean {
    return this.currentPage < Math.floor((this.cards.length - 1) / 3 /* TODO: Move to layout constant */);
  }
}
