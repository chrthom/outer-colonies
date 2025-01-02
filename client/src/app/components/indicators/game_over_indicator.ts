import { animationConfig } from 'src/app/config/animation';
import { layoutConfig } from 'src/app/config/layout';
import Game from 'src/app/scenes/game';
import { ClientGameResult } from '../../../../../server/src/shared/interfaces/client_state';
import { designConfig } from 'src/app/config/design';
import { GameResultType } from '../../../../../server/src/shared/config/enums';
import { layoutGameConfig } from 'src/app/config/layout_game';

export default class GameOverIndicator {
  private scene: Game;
  private gameResult: ClientGameResult;
  private image: Phaser.GameObjects.Image;
  private titleText: Phaser.GameObjects.Text;
  private subtitleText: Phaser.GameObjects.Text;
  private extraText: Phaser.GameObjects.Text;
  constructor(scene: Game, gameResult: ClientGameResult) {
    this.scene = scene;
    this.gameResult = gameResult;
    this.image = this.scene.add
      .image(
        layoutConfig.scene.width / 2,
        layoutConfig.scene.height / 2,
        `game_over_${this.gameResult.won ? 'victory' : 'defeat'}`
      )
      .setOrigin(0.5)
      .setDepth(layoutConfig.depth.gameOver)
      .setAlpha(0);
    this.titleText = scene.add
      .text(
        layoutConfig.scene.width / 2,
        layoutConfig.scene.height / 2 + layoutGameConfig.ui.gameOver.yOffsets.title,
        gameResult.won ? 'Sieg' : 'Niederlage'
      )
      .setFontSize(layoutConfig.fontSize.giant)
      .setFontFamily(designConfig.fontFamily.caption)
      .setColor(designConfig.color.neutral)
      .setDepth(layoutConfig.depth.gameOver)
      .setOrigin(0.5)
      .setAlpha(0);
    this.subtitleText = scene.add
      .text(
        layoutConfig.scene.width / 2,
        layoutConfig.scene.height / 2 + layoutGameConfig.ui.gameOver.yOffsets.subtitle,
        this.gameOverText
      )
      .setFontSize(layoutConfig.fontSize.large)
      .setFontFamily(designConfig.fontFamily.text)
      .setColor(designConfig.color.neutral)
      .setDepth(layoutConfig.depth.gameOver)
      .setOrigin(0.5)
      .setAlpha(0);
    this.extraText = scene.add
      .text(
        layoutConfig.scene.width / 2,
        layoutConfig.scene.height / 2 + layoutGameConfig.ui.gameOver.yOffsets.extra,
        `${this.gameResult.sol} Sol erhalten`
      )
      .setFontSize(layoutConfig.fontSize.normal)
      .setFontFamily(designConfig.fontFamily.text)
      .setColor(designConfig.color.warn)
      .setDepth(layoutConfig.depth.gameOver)
      .setOrigin(0.5)
      .setAlpha(0);
    this.scene.tweens.add({
      targets: [this.image],
      duration: animationConfig.gameOver.appear,
      alpha: 1
    });
    this.scene.tweens.add({
      targets: [this.titleText],
      delay: animationConfig.gameOver.timeOffset,
      duration: animationConfig.gameOver.appear,
      alpha: 1
    });
    this.scene.tweens.add({
      targets: [this.subtitleText],
      delay: animationConfig.gameOver.timeOffset * 2,
      duration: animationConfig.gameOver.appear,
      alpha: 1,
      completeDelay: animationConfig.gameOver.timeOffset,
      onComplete: () => {
        if (this.gameResult.sol > 0) {
          this.extraText.setAlpha(1);
          this.scene.add
            .particles(this.extraText.x, this.extraText.y, 'flare_yellow', {
              lifespan: animationConfig.attack.flare.lifetime,
              speed: { min: 200, max: 500 },
              scale: { start: 0.8, end: 0 },
              gravityY: 15,
              blendMode: 'ADD',
              emitting: false
            })
            .setDepth(layoutConfig.depth.gameOver)
            .explode(this.gameResult.sol / 5);
        }
      }
    });
  }
  private get gameOverText(): string {
    switch (this.gameResult.type) {
      case GameResultType.Countdown:
        return 'durch abgelaufene Zeit';
      case GameResultType.Depletion:
        return 'durch aufgebrauchtes Deck';
      case GameResultType.Destruction:
        return 'durch Zerstörung der Kolonie';
      default:
        return 'durch Kapitulation';
    }
  }
}
