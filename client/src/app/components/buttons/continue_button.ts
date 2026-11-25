import Phaser from 'phaser';
import { designConfig } from 'src/app/config/design';
import { layoutConfig } from '../../config/layout';
import Game from '../../scenes/game';
import Prompt from './prompt';

interface ButtonImages {
  active_build: Phaser.GameObjects.Image;
  active_combat: Phaser.GameObjects.Image;
  active_select: Phaser.GameObjects.Image;
  active_wait: Phaser.GameObjects.Image;
  inactive_combat: Phaser.GameObjects.Image;
  inactive_select: Phaser.GameObjects.Image;
  inactive_wait: Phaser.GameObjects.Image;
  won: Phaser.GameObjects.Image;
  lost: Phaser.GameObjects.Image;
}

export default class ContinueButton {
  private scene!: Game;
  private buttonImages!: ButtonImages;
  private text: Phaser.GameObjects.Text;
  private prompt!: Prompt;
  private onClickAction: () => void = () => {
    /* Do nothing */
  };

  constructor(scene: Game) {
    this.scene = scene;
    this.prompt = new Prompt(scene);
    this.buttonImages = {
      active_build: this.createButtonImage('active_build'),
      active_combat: this.createButtonImage('active_combat'),
      active_select: this.createButtonImage('active_select'),
      active_wait: this.createButtonImage('active_wait'),
      inactive_combat: this.createButtonImage('inactive_combat'),
      inactive_select: this.createButtonImage('inactive_select'),
      inactive_wait: this.createButtonImage('inactive_wait'),
      won: this.createButtonImage('won'),
      lost: this.createButtonImage('lost')
    };
    this.text = scene.add
      .text(
        layoutConfig.game.ui.continueButton.x + layoutConfig.game.ui.continueButton.xTextOffset,
        layoutConfig.game.ui.continueButton.y,
        ['']
      )
      .setFontSize(layoutConfig.fontSize.large)
      .setFontFamily(designConfig.fontFamily.caption)
      .setColor(designConfig.color.neutral)
      .setAlign('right')
      .setOrigin(1, 0.5)
      .setInteractive({
        useHandCursor: true
      });
    (<Phaser.GameObjects.GameObject[]>Object.values(this.buttonImages)).concat([this.text]).forEach(
      o =>
        o
          .on('pointerdown', (p: Phaser.Input.Pointer) => {
            if (p.leftButtonDown()) this.onClickAction();
          })
          .on('pointerover', () => {
            this.text.setColor(designConfig.color.hover);
            this.prompt.show();
          })
          .on('pointerout', () => {
            this.text.setColor(designConfig.color.neutral);
            this.prompt.hide();
          }),
      this
    );
    this.scene.input.keyboard
      ?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE, true)
      .on('down', () => this.onClickAction());
    this.waitState();
  }

  update() {
    this.prompt.update();
    this.scene.interaction.syncAutoReady();
    const vm = this.scene.interaction.getContinueButtonState();
    if (vm.isGameOver && this.scene.session.state.gameResult) {
      this.scene.showGameOverIndicator(this.scene.session.state.gameResult);
    }
    this.show(
      vm.text,
      vm.buttonKey,
      vm.enabled
        ? () => {
            if (this.scene.interaction.continueAction() === 'matchmaking') {
              this.scene.scene.start('Matchmaking');
            }
          }
        : undefined
    );
  }

  private createButtonImage(name: string) {
    return this.scene.add
      .image(layoutConfig.game.ui.continueButton.x, layoutConfig.game.ui.continueButton.y, `button_${name}`)
      .setOrigin(1, 0.5)
      .setInteractive({
        useHandCursor: true
      })
      .setVisible(false);
  }

  private show(text: string, button: string, onClickAction?: () => void) {
    this.onClickAction =
      onClickAction ??
      (() => {
        /* Do nothing */
      });
    this.showButton(button);
    this.text.setText(text);
  }

  private showButton(name: string) {
    Object.values(this.buttonImages).forEach(i => i.setVisible(false));
    this.buttonImages[name as keyof ButtonImages].setVisible(true);
  }

  private waitState() {
    const button = `${this.scene.session.state.playerIsActive ? '' : 'in'}active_wait`;
    this.show('', button);
  }
}
