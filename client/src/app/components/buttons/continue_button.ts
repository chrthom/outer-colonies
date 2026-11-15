import { animationConfig } from 'src/app/config/animation';
import {
  BattleType,
  MsgTypeInbound,
  MsgTypeOutbound,
  TurnPhase
} from '../../../../../server/src/shared/config/enums';
import { ClientGameResult, ClientState } from '../../../../../server/src/shared/interfaces/client_state';
import { layoutConfig } from '../../config/layout';
import Game from '../../scenes/game';
import Prompt from './prompt';
import Phaser from 'phaser';
import { designConfig } from 'src/app/config/design';
import GameOverIndicator from '../indicators/game_over_indicator';

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

/** Automatic Ready message a pending player emits when he cannot act himself. */
interface AutoReadyAction {
  delay: number;
  emit: () => void;
}

export default class ContinueButton {
  private scene!: Game;
  private buttonImages!: ButtonImages;
  private text: Phaser.GameObjects.Text;
  private prompt!: Prompt;
  private autoReadyTimer?: Phaser.Time.TimerEvent;
  private autoReadyState?: ClientState;
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
    this.updateAutoReady();
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
            this.showIncept();
          } else if (this.scene.state.player.hasToRetractCards) {
            this.waitState();
          } else {
            this.showNextPhase();
          }
          break;
        case TurnPhase.Combat:
          this.showNextCombatPhase();
          break;
        case TurnPhase.End:
          this.showEndPhase();
          break;
        default:
          this.waitState();
      }
    }
  }
  /**
   * Queues the automatic Ready message for a pending player who cannot act,
   * i.e. who can neither intercept in the build phase nor attack in the combat
   * phase.
   *
   * update() runs on every updateView() call, i.e. on every state update and
   * on every user interaction. To avoid duplicate Ready messages, the emission
   * is queued at most once per state (which corresponds to one pending action);
   * a queued emission from a previous state is canceled as soon as it is no
   * longer needed.
   */
  private updateAutoReady() {
    const autoReady = this.pendingAutoReady;
    if (!autoReady) {
      this.cancelPendingAutoReady();
    } else if (this.autoReadyState != this.scene.state) {
      this.cancelPendingAutoReady();
      this.autoReadyState = this.scene.state;
      this.autoReadyTimer = this.scene.time.delayedCall(autoReady.delay, () => {
        this.autoReadyTimer = undefined;
        autoReady.emit();
      });
    }
  }
  /** Cancels a queued automatic Ready message, if one exists. */
  private cancelPendingAutoReady() {
    if (this.autoReadyTimer) {
      this.scene.time.removeEvent(this.autoReadyTimer);
      this.autoReadyTimer = undefined;
    }
    this.autoReadyState = undefined;
  }
  /**
   * Ready message to automatically send for the current state, or undefined if
   * the player is not pending for an action he cannot perform himself.
   */
  private get pendingAutoReady(): AutoReadyAction | undefined {
    if (
      this.scene.state.gameResult ||
      !this.scene.state.playerPendingAction ||
      this.scene.state.intervention
    ) {
      return undefined;
    }
    switch (this.scene.state.turnPhase) {
      case TurnPhase.Build:
        return !this.scene.state.playerIsActive && !this.canIntercept
          ? {
              delay: animationConfig.duration.move,
              emit: () => this.scene.socket.emit(MsgTypeInbound.Ready, TurnPhase.Build, [])
            }
          : undefined;
      case TurnPhase.Combat:
        return !this.canAttack
          ? {
              delay: animationConfig.duration.attack,
              emit: () => this.scene.socket.emit(MsgTypeInbound.Ready, TurnPhase.Combat)
            }
          : undefined;
      default:
        return undefined;
    }
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
  private showNextPhase() {
    const text =
      this.scene.plannedBattle.shipIds.length == 0
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
    new GameOverIndicator(this.scene, gameResult);
    this.show('Neuen Gegner suchen', gameResult.won ? 'won' : 'lost', () => {
      this.scene.socket.off(MsgTypeOutbound.State);
      this.scene.scene.start('Matchmaking');
    });
  }
  private show(text: string, button: string, onClickAction?: () => void) {
    this.onClickAction = onClickAction
      ? () => {
          // The player acts himself, so a queued automatic Ready message is obsolete
          this.cancelPendingAutoReady();
          onClickAction();
        }
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
