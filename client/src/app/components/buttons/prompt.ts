import { designConfig } from 'src/app/config/design';
import { BattleType, TurnPhase } from '../../../../../server/src/shared/config/enums';
import { ClientPlannedBattleHelper } from '../../../../../server/src/shared/interfaces/client_planned_battle';
import { layoutConfig } from '../../config/layout';
import Game from '../../scenes/game';
import { animationConfig } from 'src/app/config/animation';

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
    if (!this.scene.state.playerPendingAction) {
      this.setText('Warte auf Gegenspieler...');
      this.show(true);
    } else if (this.scene.state.intervention) {
      this.showIntervention();
      this.show(true);
    } else {
      switch (this.scene.state.turnPhase) {
        case TurnPhase.Build:
          if (this.scene.state.playerIsActive) this.showBuildPhase();
          else this.showInterceptPhase();
          break;
        case TurnPhase.Combat:
          this.showCombatPhase();
          break;
        case TurnPhase.End:
          this.showEndPhase();
          this.show(true);
          break;
        default:
          this.setText('Lädt...');
      }
    }
  }
  show(withCountdown?: boolean) {
    if (!this.scene.state.gameResult) {
      this.setVisible(true);
      if (withCountdown) {
        this.scene.time.delayedCall(animationConfig.duration.promptShow, () => this.hide());
      }
      this.scene.obj?.exitButton.hide();
      this.scene.player?.countdownIndicator.hide();
    }
  }
  hide() {
    this.setVisible(false).setText('');
    this.scene.obj?.exitButton.show();
    this.scene.player?.countdownIndicator.show();
  }
  private setVisible(visible: boolean): this {
    this.text.setVisible(visible);
    this.image.setVisible(visible);
    return this;
  }
  private showBuildPhase() {
    let text: string;
    if (this.scene.state.player.hasToRetractCards) {
      text = 'Einige deiner Karten haben nicht genügend\nEnergie.\nNimm sie auf die Hand zurück!';
    } else if (this.scene.plannedBattle.type == BattleType.None) {
      text =
        'Spiele Karten von deiner Hand aus.\n' +
        'Plane dann eine Mission oder Überfall.\n\n' +
        'Klicke die gegnerische Kolonie für\n' +
        'einen Überfall bzw. dein Deck oder\n' +
        'Ablagestapel für eine Mission.';
    } else if (
      this.scene.plannedBattle.type == BattleType.Mission &&
      !ClientPlannedBattleHelper.cardLimitReached(this.scene.plannedBattle)
    ) {
      const missingCards = ClientPlannedBattleHelper.missingCards(this.scene.plannedBattle);
      text = `Wähle ${missingCards} weitere Missionskarte${missingCards == 1 ? '' : 'n'}!`;
    } else {
      text = `Wähle Schiffe für ${
        this.scene.plannedBattle.type == BattleType.Raid ? 'den Überfall' : 'die Mission'
      }!`;
    }
    this.setText(text);
  }
  private showInterceptPhase() {
    const battleText =
      this.scene.state.battle?.type == BattleType.Raid
        ? 'zur Verteidigung\ndeiner Kolonie'
        : 'zum Abfangen der\ngegenerischen Mission';
    this.setText(`Wähle Schiffe ${battleText}!`);
  }
  private showCombatPhase() {
    this.setText(
      `Aktuelle Reichweite der Gefechts: ${this.scene.state.battle?.range}\nFühre Angriffe mit deinen\nWaffensystemen durch!`
    );
  }
  private showEndPhase() {
    const cardsToDrop = this.scene.state.player.hand.length - this.scene.state.player.handCardLimit;
    this.setText(`Handkartenlimit um ${cardsToDrop} überschritten;\nLege überzählige Karten ab!`);
  }
  private showIntervention() {
    this.setText(
      'Unterbreche den gegnerischen Zug durch das\n' +
        'Spielen einer Taktikkarte mit der\n' +
        'Eigenschaft "Intervention"!'
    );
  }
  private setText(text: string): this {
    this.text.setText(text);
    return this;
  }
}
