import Phaser from 'phaser';
import { designConfig } from '../config/design';
import { layoutConfig } from '../config/layout';
import { perspectiveConfig } from '../config/perspective';
import Game from '../scenes/game';
import { OptionPickerViewModel } from '../services/game_interaction_service';
import CardImage from './card/card_image';
import { ZoomCardXPosition, ZoomCardYPosition } from './perspective';

export default class OptionPicker {
  readonly handCardUUID: string;
  readonly targetUUID: string;

  private scene: Game;
  private backgroundOverlay: Phaser.GameObjects.Rectangle;
  private cards: CardImage[] = [];
  private text: Phaser.GameObjects.Text;
  private confirmButton: Phaser.GameObjects.Text;
  private cancelButton: Phaser.GameObjects.Text;
  private nextPageButton: Phaser.GameObjects.Triangle;
  private previousPageButton: Phaser.GameObjects.Triangle;
  private escapeKey?: Phaser.Input.Keyboard.Key;
  private destroyed = false;
  private readonly uiConfig = layoutConfig.game.ui.optionPicker;

  /**
   * Creates a fullscreen picker view for the pending option selection in
   * `GameInteractionService` and registers itself on `scene.obj.optionPicker`.
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
    this.backgroundOverlay.on('pointerdown', (p: Phaser.Input.Pointer) => this.handlePointerDown(p));

    this.text = this.scene.add
      .text(layoutConfig.scene.width / 2, this.uiConfig.margin.y, '')
      .setFontSize(layoutConfig.fontSize.large)
      .setFontFamily(designConfig.fontFamily.caption)
      .setColor(designConfig.color.neutral)
      .setDepth(layoutConfig.depth.optionsPicker)
      .setOrigin(0.5);

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
      .setVisible(false)
      .on('pointerdown', (p: Phaser.Input.Pointer) =>
        this.handlePointerDown(p, () => this.scene.interaction.moveOptionPickerPage(1))
      );
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
      .setVisible(false)
      .on('pointerdown', (p: Phaser.Input.Pointer) =>
        this.handlePointerDown(p, () => this.scene.interaction.moveOptionPickerPage(-1))
      );
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
      .on('pointerdown', (p: Phaser.Input.Pointer) => this.handlePointerDown(p, () => this.cancel()));
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
      .on('pointerdown', (p: Phaser.Input.Pointer) => this.handlePointerDown(p, () => this.confirm()));
    this.confirmButton
      .on('pointerover', () => this.confirmButton.setColor(designConfig.color.warn))
      .on('pointerout', () => this.confirmButton.setColor(designConfig.color.player));

    this.escapeKey = this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC, true);
    this.escapeKey?.on('down', () => this.cancel());
    this.scene.obj.optionPicker = this;
    if (!this.scene.interaction.pendingOptionPicker) {
      this.scene.interaction.openOptionPicker(handCardUUID, targetUUID, options, optionsToSelect);
    }
    this.sync();
  }

  /**
   * Synchronizes the rendered option cards, page buttons, and counter text with
   * the current view-model in `GameInteractionService`.
   */
  sync(): void {
    const vm = this.scene.interaction.getOptionPickerViewModel();
    if (!vm) return;
    this.renderCards(vm);
    this.text.setText(vm.selectedOptionsText);
    this.confirmButton.setVisible(vm.allOptionsSelected);
    this.previousPageButton.setVisible(vm.hasPreviousPage);
    this.nextPageButton.setVisible(vm.hasNextPage);
  }

  /**
   * Destroys all picker game objects and clears the scene's pending option picker reference.
   */
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
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
    this.scene.interaction.cancelOptionPicker();
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer, action?: () => void) {
    if (pointer.rightButtonDown()) this.cancel();
    else if (pointer.leftButtonDown()) action?.();
  }

  private renderCards(vm: OptionPickerViewModel) {
    this.cards.forEach(c => c.destroy());
    this.cards = vm.visibleOptions.map((option, index) => {
      const card = new CardImage(
        this.scene,
        new ZoomCardXPosition(layoutConfig.scene.width / 2 + (index - 1) * this.uiConfig.cardsXOffset),
        new ZoomCardYPosition(layoutConfig.scene.height / 2),
        option.cardId,
        {
          perspective: layoutConfig.game.cards.perspective.none,
          z: perspectiveConfig.distance.near
        }
      ).setDepth(layoutConfig.depth.optionsPicker);
      card.image.on('pointerdown', (p: Phaser.Input.Pointer) =>
        this.handlePointerDown(p, () =>
          this.scene.interaction.toggleOptionPickerSelection(option.absoluteIndex)
        )
      );
      if (option.selected) {
        card.highlightSelected();
      }
      return card;
    });
  }

  private confirm() {
    if (this.scene.interaction.confirmOptionPicker()) {
      this.destroy();
    }
  }
}
