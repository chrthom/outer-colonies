import { animationConfig } from 'src/app/config/animation';
import {
  BattleType,
  MsgTypeInbound,
  MsgTypeOutbound,
  TurnPhase
} from '../../../../../server/src/shared/config/enums';
import { ClientPlannedBattleHelper } from '../../../../../server/src/shared/interfaces/client_planned_battle';
import { ClientGameResult } from '../../../../../server/src/shared/interfaces/client_state';
import { layoutConfig } from '../../config/layout';
import Game from '../../scenes/game';
import Prompt from './prompt';
import Phaser from 'phaser';
import { designConfig } from 'src/app/config/design';

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
        layoutConfig.ui.continueButton.x + layoutConfig.ui.continueButton.xTextOffset,
        layoutConfig.ui.continueButton.y,
        ['']
      )
      .setFontSize(layoutConfig.fontSize.large)
      .setFontFamily(designConfig.font.captionFamily)
      .setColor(designConfig.font.color)
      .setAlign('right')
      .setOrigin(1, 0.5)
      .setInteractive();
    (<Phaser.GameObjects.GameObject[]>Object.values(this.buttonImages)).concat([this.text]).forEach(
      o =>
        o
          .on('pointerdown', () => this.onClickAction())
          .on('pointerover', () => this.text.setColor(designConfig.font.colorHover))
          .on('pointerout', () => this.text.setColor(designConfig.font.color)),
      this
    );
    this.scene.input.keyboard
      ?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE, true)
      .on('down', () => this.onClickAction());
    this.waitState();
  }
  update() {
    this.prompt.update();
    if (this.scene.state.gameResult) {
      this.showGameOver(this.scene.state.gameResult);
    } else if (!this.scene.state.playerPendingAction) {
      this.waitState();
    } else if (this.scene.state.intervention) {
      this.showIntervention(this.scene.state.playerIsActive);
    } else {
      switch (this.scene.state.turnPhase) {
        case TurnPhase.Build:
          if (!this.scene.state.playerIsActive) {
            if (!this.canIntercept) {
              this.scene.time.delayedCall(animationConfig.duration.move, () => {
                this.scene.socket.emit(MsgTypeInbound.Ready, TurnPhase.Build, []);
              });
            }
            this.showIncept();
          } else if (this.scene.state.hasToRetractCards) {
            this.waitState();
          } else {
            this.showNextPhase();
          }
          break;
        case TurnPhase.Combat:
          this.showNextCombatPhase();
          if (!this.canAttack) {
            this.scene.time.delayedCall(animationConfig.duration.attack, () => {
              this.scene.socket.emit(MsgTypeInbound.Ready, TurnPhase.Combat);
            });
          }
          break;
        case TurnPhase.End:
          this.showEndPhase();
          break;
        default:
          this.waitState();
      }
    }
  }
  showPrompt() {
    this.prompt.setVisible(true);
  }
  hidePrompt() {
    this.prompt.setVisible(false);
  }
  private createButtonImage(name: string) {
    return this.scene.add
      .image(layoutConfig.ui.continueButton.x, layoutConfig.ui.continueButton.y, `button_${name}`)
      .setOrigin(1, 0.5)
      .setInteractive()
      .setVisible(false);
  }
  private showNextPhase() {
    const text =
      this.scene.plannedBattle.shipIds.length == 0 ||
      (this.scene.plannedBattle.type == BattleType.Mission &&
        !ClientPlannedBattleHelper.cardLimitReached(this.scene.plannedBattle))
        ? 'Zug beenden'
        : `${this.scene.plannedBattle.type == BattleType.Mission ? 'Mission' : 'Überfall'} durchführen`;
    this.show(text, 'active_build', () =>
      this.scene.socket.emit(MsgTypeInbound.Ready, TurnPhase.Build, this.scene.plannedBattle)
    );
  }
  private showIncept() {
    let text: string;
    if (this.scene.state.battle?.type == BattleType.Raid) text = 'Verteidigung beginnen';
    else if (this.scene.interceptShipIds.length > 0) text = 'Abfangen';
    else text = 'Überspringen';
    this.show(text, 'inactive_select', () =>
      this.scene.socket.emit(MsgTypeInbound.Ready, TurnPhase.Build, this.scene.interceptShipIds)
    );
  }
  private showNextCombatPhase() {
    const button = `${this.scene.state.playerIsActive ? '' : 'in'}active_combat`;
    this.show('Kampfphase beenden', button, () =>
      this.scene.socket.emit(MsgTypeInbound.Ready, TurnPhase.Combat)
    );
  }
  private showEndPhase() {
    this.show('Karten ablegen', 'active_select');
  }
  private showIntervention(isActivePlayer: boolean) {
    this.show('Überspringen', `${isActivePlayer ? '' : 'in'}active_select`, () =>
      this.scene.socket.emit(MsgTypeInbound.Ready, this.scene.state.turnPhase)
    );
  }
  private showGameOver(gameResult: ClientGameResult) {
    this.show('Neuen Gegner suchen', gameResult.won ? 'won' : 'lost', () => {
      this.scene.socket.off(MsgTypeOutbound.State);
      this.scene.scene.start('Matchmaking');
    });
  }
  private show(text: string, button: string, onClickAction?: () => void) {
    this.onClickAction = onClickAction
      ? onClickAction
      : () => {
          /* Do nothing */
        };
    this.showButton(button);
    this.text.setText(text);
  }
  private showButton(name: string) {
    Object.values(this.buttonImages).forEach(i => i.setVisible(false));
    this.buttonImages[name as keyof ButtonImages].setVisible(true);
  }
  private waitState() {
    const button = `${this.scene.state && this.scene.state.playerIsActive ? '' : 'in'}active_wait`;
    this.show('', button);
  }
  private get canIntercept() {
    return this.scene.state.cardStacks.filter(cs => cs.ownedByPlayer).some(cs => cs.interceptionReady);
  }
  private get canAttack() {
    return this.scene.state.cardStacks
      .filter(cs => this.scene.state.battle.playerShipIds.includes(cs.uuid), this)
      .some(cs => cs.cards.some(c => c.battleReady));
  }
}
