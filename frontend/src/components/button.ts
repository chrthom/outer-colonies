import { BattleType, MsgTypeInbound, MsgTypeOutbound, TurnPhase } from "../../../backend/src/components/config/enums";
import { FrontendPlannedBattle } from "../../../backend/src/components/frontend_converters/frontend_planned_battle";
import { layout } from "../config/layout";
import Game from "../scenes/game";

export default class Button {
    text: Phaser.GameObjects.Text;
    private scene: Game;
    private onClickAction: () => void = () => {};
    constructor(scene: Game) {
        this.scene = scene;
        const self = this;
        this.text = scene.add.text(layout.continueButton.x, layout.continueButton.y, [''])
            .setFontSize(layout.continueButton.fontSize)
            .setFontFamily('Impact')
            .setColor('#eeeeaa')
            .setAlign('right')
            .setOrigin(1, 0)
            .setInteractive();
        this.text.on('pointerdown', () => {
            self.onClickAction();
        });
        this.text.on('pointerover', () => {
            self.text.setColor('#ff69b4');
        });
        this.text.on('pointerout', () => {
            self.text.setColor('#eeeeaa');
        });
        this.hide();
    }
    update() {
        if (this.scene.state.gameResult) {
            this.showGameOver();
        } else if (this.scene.state.playerPendingAction) {
            if (this.scene.state.turnPhase == TurnPhase.Build) {
                if (!this.scene.state.playerIsActive) this.showIntervene();
                else if (this.scene.state.hasToRetractCards) this.hide();
                else this.showNextPhase();
            } else if (this.scene.state.turnPhase == TurnPhase.Combat) {
                this.showNextCombatPhase();
            } else {
                this.hide();
            }
        } else {
            this.hide();
        }
    }
    private showNextPhase() {
        const text = this.scene.plannedBattle.shipIds.length == 0 
                || this.scene.plannedBattle.type == BattleType.Mission && !FrontendPlannedBattle.cardLimitReached(this.scene.plannedBattle) ? 
            'Zug beenden' :
            `${this.scene.plannedBattle.type == BattleType.Mission ? 'Mission' : 'Überfall'} durchführen`;
        this.show(text, () => this.scene.socket.emit(MsgTypeInbound.Ready, TurnPhase.Build, this.scene.plannedBattle));
    }
    private showIntervene() {
        let text: string; 
        if (this.scene.state.battle.type == BattleType.Raid) text = 'Verteidigung beginnen';
        else if (this.scene.interveneShipIds.length > 0) text = 'Intervenieren';
        else text = 'Überspringen';
        this.show(text, () => this.scene.socket.emit(MsgTypeInbound.Ready, TurnPhase.Build, this.scene.interveneShipIds));
    }
    private showNextCombatPhase() {
        this.show('Kampfphase beenden', () => this.scene.socket.emit(MsgTypeInbound.Ready, TurnPhase.Combat));
    }
    private showGameOver() {
        this.show('Neuen Gegner suchen', () => {
            this.scene.socket.off(MsgTypeOutbound.State);
            this.scene.scene.start('Matchmaking');
        });
    }
    private show(text: string, onClickAction: () => void) {
        this.onClickAction = onClickAction;
        this.text.setText(text);
        this.text.visible = true;
    }
    private hide() {
        this.text.visible = false;
    }
}