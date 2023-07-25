import { BattleType, GameResultType, TurnPhase } from '../../../../../server/src/components/config/enums';
import { ClientPlannedBattle } from '../../../../../server/src/components/shared_interfaces/client_planned_battle';
import { ClientGameResult } from '../../../../../server/src/components/shared_interfaces/client_state';
import { layout } from '../../config/layout';
import Game from '../../scenes/game';

export default class Prompt {
  private scene: Game;
  private text: Phaser.GameObjects.Text;
  private image!: Phaser.GameObjects.Image;
  constructor(scene: Game) {
    this.scene = scene;
    this.image = this.scene.add
      .image(layout.prompt.box.x, layout.prompt.box.y, 'prompt_box')
      .setOrigin(0, 0)
      .setScale(0.8);
    this.text = scene.add
      .text(layout.prompt.x, layout.prompt.y, 'Lädt...')
      .setFontSize(layout.prompt.fontSize)
      .setFontFamily(layout.font.textFamily)
      .setColor(layout.font.color)
      .setAlign('left')
      .setOrigin(0, 0);
  }
  update() {
    if (this.scene.state.gameResult) {
      this.showGameOver(this.scene.state.gameResult);
    } else if (this.scene.state.playerPendingAction) {
      switch (this.scene.state.turnPhase) {
        case TurnPhase.Build:
          if (this.scene.state.playerIsActive) this.showBuildPhase();
          else this.showIntervenePhase();
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
    } else {
      this.show('Warte auf Gegenspieler...');
    }
  }
  setVisible(visible: boolean) {
    this.text.setVisible(visible);
    this.image.setVisible(visible);
  }
  private showBuildPhase() {
    let text: string = '';
    if (this.scene.plannedBattle.type == BattleType.None) {
      if (this.scene.state.hasToRetractCards) {
        text += 'Einige deiner Karten haben nicht genügend Energie.\n Nehme sie auf die Hand zurück!\n';
      }
      text +=
        'Spiele Karten von deiner Hand aus.\n' +
        'Plane dann eine Mission oder Überfall.\n' +
        'Klicke die gegnerische Kolonie für einen Überfall\n' +
        'bzw. dein Deck oder Ablagestapel für eine Mission.';
    } else if (
      this.scene.plannedBattle.type == BattleType.Mission &&
      !ClientPlannedBattle.cardLimitReached(this.scene.plannedBattle)
    ) {
      const missingCards = ClientPlannedBattle.missingCards(this.scene.plannedBattle);
      text += `Wähle ${missingCards} weitere Missionskarte${missingCards == 1 ? '' : 'n'}`;
    } else {
      text += `Wähle Schiffe für ${
        this.scene.plannedBattle.type == BattleType.Raid ? 'den Überfall' : 'die Mission'
      }`;
    }
    this.show(text);
  }
  private showIntervenePhase() {
    const battleText =
      this.scene.state.battle?.type == BattleType.Raid
        ? 'Verteidigung deiner Kolonie'
        : 'Intervention der gegenerischen\nMission';
    this.show(`Wähle Schiffe zur ${battleText}`);
  }
  private showCombatPhase() {
    this.show(
      `Aktuelle Reichweite der Gefechts: ${this.scene.state.battle?.range}\nFühre Angriffe mit deinen Waffensystemen durch`,
    );
  }
  private showEndPhase() {
    const cardsToDrop = this.scene.state.hand.length - this.scene.state.handCardLimit;
    this.show(`Handkartenlimit um ${cardsToDrop} überschritten;\nLege überzählige Karten ab!`);
  }
  private showGameOver(gameResult: ClientGameResult) {
    let gameOverText: string;
    if (gameResult.won) {
      if (gameResult.type == GameResultType.Depletion) gameOverText = 'Gegnerisches Deck aufgebraucht';
      else if (gameResult.type == GameResultType.Destruction) gameOverText = 'Gegnerische Kolonie zerstört';
      else if (gameResult.type == GameResultType.Surrender) gameOverText = 'Gegner hat kapituliert';
    } else {
      if (gameResult.type == GameResultType.Depletion) gameOverText = 'Eigenes Deck aufgebraucht';
      else if (gameResult.type == GameResultType.Destruction) gameOverText = 'Eigene Kolonie zerstört';
    }
    this.show(`${gameResult.won ? 'SIEG' : 'NIEDERLAGE'}\n${gameOverText}\n\nBelohnung: ${gameResult.sol} Sol`);
    this.text.setFontSize(layout.prompt.fontSizeBig);
  }
  private show(text: string) {
    this.text.setText(text);
  }
}
