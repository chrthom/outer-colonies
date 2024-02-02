import { designConfig } from 'src/app/config/design';
import { BattleType, GameResultType, TurnPhase } from '../../../../../server/src/shared/config/enums';
import { ClientPlannedBattleHelper } from '../../../../../server/src/shared/interfaces/client_planned_battle';
import { ClientGameResult } from '../../../../../server/src/shared/interfaces/client_state';
import { layoutConfig } from '../../config/layout';
import Game from '../../scenes/game';

export default class Prompt {
  private scene: Game;
  private text: Phaser.GameObjects.Text;
  private image!: Phaser.GameObjects.Image;
  constructor(scene: Game) {
    this.scene = scene;
    this.image = this.scene.add
      .image(layoutConfig.game.ui.prompt.box.x, layoutConfig.game.ui.prompt.box.y, 'prompt_box')
      .setOrigin(0, 0)
      .setScale(0.8);
    this.text = scene.add
      .text(layoutConfig.game.ui.prompt.x, layoutConfig.game.ui.prompt.y, 'Lädt...')
      .setFontSize(layoutConfig.fontSize.small)
      .setFontFamily(designConfig.fontFamily.text)
      .setColor(designConfig.color.neutral)
      .setAlign('left')
      .setOrigin(0, 0);
  }
  update() {
    if (this.scene.state.gameResult) {
      this.showGameOver(this.scene.state.gameResult);
    } else if (!this.scene.state.playerPendingAction) {
      this.show('Warte auf Gegenspieler...');
    } else if (this.scene.state.intervention) {
      this.showIntervention();
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
          break;
        default:
          this.show('Lädt...');
      }
    }
  }
  setVisible(visible: boolean) {
    this.text.setVisible(visible);
    this.image.setVisible(visible);
  }
  private showBuildPhase() {
    let text: string;
    if (this.scene.state.hasToRetractCards) {
      text = 'Einige deiner Karten haben nicht genügend Energie.\nNimm sie auf die Hand zurück!\n';
    } else if (this.scene.plannedBattle.type == BattleType.None) {
      text =
        'Spiele Karten von deiner Hand aus.\n' +
        'Plane dann eine Mission oder Überfall.\n' +
        'Klicke die gegnerische Kolonie für einen Überfall\n' +
        'bzw. dein Deck oder Ablagestapel für eine Mission.';
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
    this.show(text);
  }
  private showInterceptPhase() {
    const battleText =
      this.scene.state.battle?.type == BattleType.Raid
        ? 'zur Verteidigung deiner Kolonie'
        : 'zum Abfangen der gegenerischen\nMission';
    this.show(`Wähle Schiffe ${battleText}!`);
  }
  private showCombatPhase() {
    this.show(
      `Aktuelle Reichweite der Gefechts: ${this.scene.state.battle?.range}\nFühre Angriffe mit deinen Waffensystemen durch!`
    );
  }
  private showEndPhase() {
    const cardsToDrop = this.scene.state.hand.length - this.scene.state.handCardLimit;
    this.show(`Handkartenlimit um ${cardsToDrop} überschritten;\nLege überzählige Karten ab!`);
  }
  private showIntervention() {
    this.show(
      'Unterbreche den gegnerischen Zug durch das\nSpielen einer Taktikkarte mit der Eigenschaft\n"Intervention"!'
    );
  }
  private showGameOver(gameResult: ClientGameResult) {
    let gameOverText = '';
    if (gameResult.won) {
      switch (gameResult.type) {
        case GameResultType.Countdown:
          gameOverText = 'Zeit des Gegners ist abgelaufen';
          break;
        case GameResultType.Depletion:
          gameOverText = 'Gegnerisches Deck aufgebraucht';
          break;
        case GameResultType.Destruction:
          gameOverText = 'Gegnerische Kolonie zerstört';
          break;
        case GameResultType.Surrender:
          gameOverText = 'Gegner hat kapituliert';
      }
    } else {
      switch (gameResult.type) {
        case GameResultType.Countdown:
          gameOverText = 'Eigene Zeit ist abgelaufen';
          break;
        case GameResultType.Depletion:
          gameOverText = 'Eigenes Deck aufgebraucht';
          break;
        case GameResultType.Destruction:
          gameOverText = 'Eigene Kolonie zerstört';
      }
    }
    this.show(
      `${gameResult.won ? 'SIEG' : 'NIEDERLAGE'}\n${gameOverText}\n\nBelohnung: ${gameResult.sol} Sol`
    );
    this.text.setFontSize(layoutConfig.fontSize.normal);
  }
  private show(text: string) {
    this.text.setText(text);
  }
}
