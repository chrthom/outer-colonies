import { BattleType, MsgTypeInbound, MsgTypeOutbound, TurnPhase } from "../../../server/src/components/config/enums";
import { ClientPlannedBattle } from "../../../server/src/components/api/client_planned_battle";
import { ClientGameResult } from "../../../server/src/components/api/client_state";
import { layout } from "../config/layout";
import Game from "../scenes/game";
import Prompt from "./prompt";

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

export default class Button {
    text: Phaser.GameObjects.Text;
    private scene!: Game;
    private buttonImages!: ButtonImages;
    private prompt!: Prompt;
    private onClickAction: () => void = () => {};
    constructor(scene: Game) {
        this.scene = scene;
        const self = this;
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
        }
        this.text = scene.add.text(
                layout.continueButton.x + layout.continueButton.xTextOffset,
                layout.continueButton.y,
                ['']
            )
            .setFontSize(layout.continueButton.fontSize)
            .setFontFamily(layout.font.captionFamily)
            .setColor(layout.font.color)
            .setAlign('right')
            .setOrigin(1, 0.5)
            .setInteractive();
        (<Phaser.GameObjects.GameObject[]> Object.values(this.buttonImages))
            .concat([ this.text ])
            .forEach(o => o
                .on('pointerdown', () => {
                    self.onClickAction();
                })
                .on('pointerover', () => {
                    self.text.setColor(layout.font.colorHover);
                    self.prompt.setVisible(true);
                })
                .on('pointerout', () => {
                    self.text.setColor(layout.font.color);
                    self.prompt.setVisible(false);
                })
            );
        this.waitState();
    }
    update() {
        this.prompt.update();
        if (this.scene.state.gameResult) {
            this.showGameOver(this.scene.state.gameResult);
        } else if (this.scene.state.playerPendingAction) {
            switch (this.scene.state.turnPhase) {
                case TurnPhase.Build:
                    if (!this.scene.state.playerIsActive) this.showIntervene();
                    else if (this.scene.state.hasToRetractCards) this.waitState();
                    else this.showNextPhase();
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
        } else {
            this.waitState();
        }
    }
    private createButtonImage(name: string) {
        return this.scene.add
            .image(layout.continueButton.x, layout.continueButton.y, `button_${name}`)
            .setOrigin(1, 0.5)
            .setInteractive()
            .setVisible(false);
    }
    private showNextPhase() {
        const text = this.scene.plannedBattle.shipIds.length == 0 
                || this.scene.plannedBattle.type == BattleType.Mission && !ClientPlannedBattle.cardLimitReached(this.scene.plannedBattle) ? 
            'Zug beenden' :
            `${this.scene.plannedBattle.type == BattleType.Mission ? 'Mission' : 'Überfall'} durchführen`;
        this.show(text, 'active_build', () => 
            this.scene.socket.emit(MsgTypeInbound.Ready, TurnPhase.Build, this.scene.plannedBattle));
    }
    private showIntervene() {
        let text: string; 
        if (this.scene.state.battle.type == BattleType.Raid) text = 'Verteidigung beginnen';
        else if (this.scene.interveneShipIds.length > 0) text = 'Intervenieren';
        else text = 'Überspringen';
        this.show(text, 'inactive_select', () => this.scene.socket.emit(MsgTypeInbound.Ready, TurnPhase.Build, this.scene.interveneShipIds));
    }
    private showNextCombatPhase() {
        const button = `${this.scene.state.playerIsActive ? '' : 'in'}active_combat`;
        this.show('Kampfphase beenden', button, () => this.scene.socket.emit(MsgTypeInbound.Ready, TurnPhase.Combat));
    }
    private showEndPhase() {
        this.show('Karten ablegen', 'active_select', () => {});
    }
    private showGameOver(gameResult: ClientGameResult) {
        this.show('Neuen Gegner suchen', gameResult.won ? 'won' : 'lost', () => {
            this.scene.socket.off(MsgTypeOutbound.State);
            this.scene.scene.start('Matchmaking');
        });
    }
    private show(text: string, button: string, onClickAction: () => void) {
        this.onClickAction = onClickAction;
        this.showButton(button);
        this.text.setText(text);
    }
    private showButton(name: string) {
        Object.values(this.buttonImages).forEach(i => i.setVisible(false));
        this.buttonImages[name].setVisible(true);
    }
    private waitState() {
        const button = `${this.scene.state && this.scene.state.playerIsActive ? '' : 'in'}active_wait`;
        this.show('', button, () => {});
    }
}