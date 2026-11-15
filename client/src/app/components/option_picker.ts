import { MsgTypeInbound, TurnPhase } from '@shared/config/enums';
import { designConfig } from '../config/design';
import { layoutConfig } from '../config/layout';
import { perspectiveConfig } from '../config/perspective';
import { ClientState } from '@shared/interfaces/client_state';
import Game from '../scenes/game';
import CardImage from './card/card_image';
import { ZoomCardXPosition, ZoomCardYPosition } from './perspective';
import Phaser from 'phaser';

export default class OptionPicker {
  private scene: Game;
  private handCardUUID: string;
  private targetUUID: string;
  private backgroundOverlay: Phaser.GameObjects.Rectangle;
  private cards: CardImage[] = [];
  private text: Phaser.GameObjects.Text;
  private confirmButton: Phaser.GameObjects.Text;
  private cancelButton: Phaser.GameObjects.Text;
  private nextPageButton: Phaser.GameObjects.Triangle;
  private previousPageButton: Phaser.GameObjects.Triangle;
  private escapeKey?: Phaser.Input.Keyboard.Key;
  private options: number[];
  private optionsToSelect: number;
  private selectedIndexes: number[] = [];
  private currentPage: number = 1;
  private readonly uiConfig = layoutConfig.game.ui.optionPicker;
  /**
   * Creates a fullscreen picker for the options of a hand card to be played on a target
   * stack and registers itself as the scene's pending option picker.
   * @param scene game scene
   * @param handCardUUID UUID of the hand card to be played; captured at construction time,
   * so that confirming still emits the correct card after an interleaved state change
   * @param targetUUID UUID of the card stack the hand card is played on
   * @param options card ids selectable as options
   * @param optionsToSelect number of options to select
   */
  constructor(
    scene: Game,
    handCardUUID: string,
    targetUUID: string,
    options: number[],
    optionsToSelect: number
  ) {
    this.scene = scene;
    this.handCardUUID = handCardUUID;
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
    this.backgroundOverlay.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.rightButtonDown()) this.cancel();
    });
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
    this.cancelButton = this.scene.add
      .text(layoutConfig.scene.width - this.uiConfig.margin.x, this.uiConfig.margin.y, 'X')
      .setFontSize(layoutConfig.fontSize.giant)
      .setFontFamily(designConfig.fontFamily.caption)
      .setColor(designConfig.color.opponent)
      .setDepth(layoutConfig.depth.optionsPicker)
      .setOrigin(1, 0.5)
      .setInteractive({
        useHandCursor: true
      })
      .on('pointerdown', (p: Phaser.Input.Pointer) => {
        if (p.leftButtonDown()) this.cancel();
      });
    this.cancelButton
      .on('pointerover', () => this.cancelButton.setColor(designConfig.color.hover))
      .on('pointerout', () => this.cancelButton.setColor(designConfig.color.opponent));
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
    this.escapeKey = this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC, true);
    this.escapeKey?.on('down', () => this.cancel());
    this.scene.obj.optionPicker = this;
  }
  /**
   * Destroys all picker game objects and clears the scene's pending option picker reference.
   */
  destroy() {
    if (this.escapeKey) this.scene.input.keyboard?.removeKey(this.escapeKey, true, true);
    this.escapeKey = undefined;
    [
      this.backgroundOverlay,
      this.text,
      this.confirmButton,
      this.cancelButton,
      this.nextPageButton,
      this.previousPageButton
    ].map(o => o.destroy());
    this.cards.forEach(c => c.destroy());
    this.scene.obj.optionPicker = undefined;
  }
  /**
   * Aborts the option selection without emitting anything and resets the selection state.
   */
  cancel() {
    this.destroy();
    this.scene.activeCards.hand = undefined;
    this.scene.updateView();
  }
  /**
   * Whether the pending action (playing the hand card on the target stack with the
   * selected options) is still valid for the given state. The scene must destroy pending
   * pickers on incoming states that invalidate their action.
   * @param state incoming client state
   */
  isValidFor(state: ClientState): boolean {
    return (
      state.playerPendingAction &&
      !state.intervention &&
      state.turnPhase == TurnPhase.Build &&
      state.playerIsActive &&
      state.cardStacks.some(cs => cs.uuid == this.targetUUID) &&
      state.player.hand.some(
        h => h.uuid == this.handCardUUID && h.playable && h.validTargets.includes(this.targetUUID)
      )
    );
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
      const selectedCardIds = this.selectedIndexes.map(i => this.options[i]);
      this.destroy();
      this.scene.socket.emit(MsgTypeInbound.Handcard, this.handCardUUID, this.targetUUID, selectedCardIds);
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
