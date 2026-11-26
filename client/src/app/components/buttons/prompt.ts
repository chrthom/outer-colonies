import { designConfig } from 'src/app/config/design';
import { animationConfig } from 'src/app/config/animation';
import { layoutConfig } from '../../config/layout';
import Game from '../../scenes/game';

export default class Prompt {
  private scene: Game;
  private text: Phaser.GameObjects.Text;
  private image!: Phaser.GameObjects.Image;
  constructor(scene: Game) {
    this.scene = scene;
    this.image = this.scene.add
      .image(layoutConfig.game.ui.prompt.x, layoutConfig.game.ui.prompt.y, 'prompt_box')
      .setDepth(layoutConfig.depth.prompt)
      .setOrigin(0)
      .setScale(0.8);
    this.text = scene.add
      .text(
        layoutConfig.game.ui.prompt.x + layoutConfig.game.ui.prompt.textOffset.x,
        layoutConfig.game.ui.prompt.y + layoutConfig.game.ui.prompt.textOffset.y,
        'Lädt...'
      )
      .setFontSize(layoutConfig.fontSize.normal)
      .setFontFamily(designConfig.fontFamily.text)
      .setColor(designConfig.color.neutral)
      .setAlign('left')
      .setDepth(layoutConfig.depth.prompt)
      .setOrigin(0);
    this.hide();
  }
  update() {
    this.hide();
    // While the game-over screen is displayed, no phase prompt must be shown
    // and the exit button must stay visible.
    const vm = this.scene.interaction.getPromptState();
    if (vm.isGameOver) return;
    this.setText(vm.text);
    if (vm.visible) {
      this.show(vm.autoHide);
    }
  }
  show(withCountdown?: boolean) {
    if (!this.scene.session.state.gameResult) {
      this.setVisible(true);
      if (withCountdown) {
        this.scene.time.delayedCall(animationConfig.duration.promptShow, () => this.hide());
      }
      this.scene.obj?.exitButton.hide();
    }
  }
  hide() {
    this.setVisible(false);
    this.scene.obj?.exitButton.show();
  }
  private setVisible(visible: boolean): this {
    this.text.setVisible(visible);
    this.image.setVisible(visible);
    return this;
  }
  private setText(text: string): this {
    this.text.setText(text);
    return this;
  }
}
