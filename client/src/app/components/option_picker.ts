import { MsgTypeInbound } from '../../../../server/src/shared/config/enums';
import { designConfig } from '../config/design';
import { layoutConfig } from '../config/layout';
import { perspectiveConfig } from '../config/perspective';
import Game from '../scenes/game';
import CardImage from './card/card_image';
import { ZoomCardXPosition, ZoomCardYPosition } from './perspective';

export default class OptionPicker {
  private scene: Game;
  private targetUUID: string;
  private backgroundOverlay: Phaser.GameObjects.Rectangle;
  private cards: CardImage[] = [];
  private text: Phaser.GameObjects.Text;
  private confirmButton: Phaser.GameObjects.Text;
  private nextPageButton: Phaser.GameObjects.Triangle;
  private previousPageButton: Phaser.GameObjects.Triangle;
  private options: number[];
  private optionsToSelect: number;
  private selectedIndexes: number[] = [];
  private currentPage: number = 1;
  private readonly uiConfig = layoutConfig.game.ui.optionPicker;
  constructor(scene: Game, targetUUID: string, options: number[], optionsToSelect: number) {
    this.scene = scene;
    this.targetUUID = targetUUID;
    this.options = options;
    this.optionsToSelect = optionsToSelect;
    this.backgroundOverlay = this.scene.add
      .rectangle(
        0,
        0,
        layoutConfig.scene.width,
        layoutConfig.scene.height,
        designConfig.tint.dark,
        designConfig.alpha.normal
      )
      .setDepth(layoutConfig.depth.optionsPicker)
      .setOrigin(0)
      .setInteractive();
    this.text = this.scene.add
      .text(layoutConfig.scene.width / 2, this.uiConfig.margin.y, this.selectedOptionsText)
      .setFontSize(layoutConfig.fontSize.large)
      .setFontFamily(designConfig.fontFamily.caption)
      .setColor(designConfig.color.neutral)
      .setDepth(layoutConfig.depth.optionsPicker)
      .setOrigin(0.5);
    this.createCards();
    this.nextPageButton = this.scene.add
      .triangle(
        layoutConfig.scene.width - this.uiConfig.margin.x - this.uiConfig.arrowSize,
        layoutConfig.scene.height / 2 - this.uiConfig.arrowSize,
        0,
        0,
        0,
        2 * this.uiConfig.arrowSize,
        this.uiConfig.arrowSize,
        this.uiConfig.arrowSize,
        designConfig.tint.player,
        designConfig.alpha.normal
      )
      .setDepth(layoutConfig.depth.optionsPicker)
      .setOrigin(0)
      .setInteractive({
        useHandCursor: true
      })
      .setVisible(this.hasNextPage)
      .on('pointerdown', (p: Phaser.Input.Pointer) => {
        if (p.leftButtonDown()) this.movePageBy(1);
      });
    this.nextPageButton
      .on('pointerover', () =>
        this.nextPageButton.setFillStyle(designConfig.tint.opponent, designConfig.alpha.normal)
      )
      .on('pointerout', () =>
        this.nextPageButton.setFillStyle(designConfig.tint.player, designConfig.alpha.normal)
      );
    this.previousPageButton = this.scene.add
      .triangle(
        this.uiConfig.margin.x,
        layoutConfig.scene.height / 2 - this.uiConfig.arrowSize,
        0,
        this.uiConfig.arrowSize,
        this.uiConfig.arrowSize,
        0,
        this.uiConfig.arrowSize,
        2 * this.uiConfig.arrowSize,
        designConfig.tint.player,
        designConfig.alpha.normal
      )
      .setDepth(layoutConfig.depth.optionsPicker)
      .setOrigin(0)
      .setInteractive({
        useHandCursor: true
      })
      .setVisible(this.hasPreviousPage)
      .on('pointerdown', (p: Phaser.Input.Pointer) => {
        if (p.leftButtonDown()) this.movePageBy(-1);
      });
    this.previousPageButton
      .on('pointerover', () =>
        this.previousPageButton.setFillStyle(designConfig.tint.opponent, designConfig.alpha.normal)
      )
      .on('pointerout', () =>
        this.previousPageButton.setFillStyle(designConfig.tint.player, designConfig.alpha.normal)
      );
    this.confirmButton = this.scene.add
      .text(layoutConfig.scene.width / 2, layoutConfig.scene.height - this.uiConfig.margin.y, 'OK')
      .setFontSize(layoutConfig.fontSize.giant)
      .setFontFamily(designConfig.fontFamily.caption)
      .setColor(designConfig.color.player)
      .setDepth(layoutConfig.depth.optionsPicker)
      .setOrigin(0.5)
      .setInteractive({
        useHandCursor: true
      })
      .setVisible(false)
      .on('pointerdown', (p: Phaser.Input.Pointer) => {
        if (p.leftButtonDown()) this.confirm();
      });
    this.confirmButton
      .on('pointerover', () => this.confirmButton.setColor(designConfig.color.warn))
      .on('pointerout', () => this.confirmButton.setColor(designConfig.color.player));
  }
  destroy() {
    [this.backgroundOverlay, this.text, this.confirmButton, this.nextPageButton, this.previousPageButton].map(
      o => o.destroy()
    );
    this.cards.forEach(c => c.destroy());
  }
  private createCards() {
    this.cards.forEach(c => c.destroy());
    this.cards = this.options
      .filter((_, index) => index >= (this.currentPage - 1) * 3 && index < this.currentPage * 3)
      .map((cardId, index) =>
        new CardImage(
          this.scene,
          new ZoomCardXPosition(layoutConfig.scene.width / 2 + (index - 1) * this.uiConfig.cardsXOffset),
          new ZoomCardYPosition(layoutConfig.scene.height / 2),
          cardId,
          {
            perspective: layoutConfig.game.cards.perspective.none,
            z: perspectiveConfig.distance.near
          }
        ).setDepth(layoutConfig.depth.optionsPicker)
      );
    this.cards.forEach((c, index) =>
      c.image.on('pointerdown', (p: Phaser.Input.Pointer) => {
        if (p.leftButtonDown()) this.onCardClick(this.absoluteCardIndex(index));
      })
    );
    this.cards
      .filter((_, index) => this.selectedIndexes.includes(this.absoluteCardIndex(index)))
      .forEach(c => c.highlightSelected());
  }
  private absoluteCardIndex(relativeIndex: number): number {
    return relativeIndex + (this.currentPage - 1) * 3;
  }
  private confirm() {
    if (this.allOptionsSelected) {
      this.destroy();
      this.scene.obj.optionPicker = undefined;
      const selectedCardIds = this.selectedIndexes.map(i => this.options[i]);
      this.scene.socket.emit(
        MsgTypeInbound.Handcard,
        this.scene.activeCards.hand,
        this.targetUUID,
        selectedCardIds
      );
    }
  }
  private movePageBy(pageModificator: number) {
    if (this.currentPage + pageModificator > 0 && this.currentPage + pageModificator <= this.maxPage) {
      this.currentPage += pageModificator;
      this.updateDisplay();
    }
  }
  private onCardClick(index: number) {
    if (this.selectedIndexes.includes(index)) {
      this.selectedIndexes = this.selectedIndexes.filter(c => c != index);
    } else if (!this.allOptionsSelected) {
      this.selectedIndexes.push(index);
    }
    this.updateDisplay();
  }
  private updateDisplay() {
    this.createCards();
    this.text.setText(this.selectedOptionsText);
    this.confirmButton.setVisible(this.allOptionsSelected);
    this.previousPageButton.setVisible(this.hasPreviousPage);
    this.nextPageButton.setVisible(this.hasNextPage);
  }
  private get selectedOptionsText(): string {
    return (
      `${this.selectedIndexes.length}/${this.optionsToSelect} Karten ausgewählt - ` +
      `zeige Seite ${this.currentPage}/${this.maxPage}`
    );
  }
  private get allOptionsSelected(): boolean {
    return this.selectedIndexes.length == this.optionsToSelect;
  }
  private get maxPage(): number {
    return Math.floor((this.options.length - 1) / 3) + 1;
  }
  private get hasPreviousPage(): boolean {
    return this.currentPage > 1;
  }
  private get hasNextPage(): boolean {
    return this.currentPage < this.maxPage;
  }
}
