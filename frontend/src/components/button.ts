import { BattleType, MsgTypeInbound, MsgTypeOutbound, TurnPhase } from "../../../backend/src/components/config/enums";
import { FrontendPlannedBattle } from "../../../backend/src/components/frontend_converters/frontend_planned_battle";
import { FrontendBattle } from "../../../backend/src/components/frontend_converters/frontend_state";
import Layout from "../config/layout";
import Game from "../scenes/game";

const layout = new Layout();

export default class Button {
    sprite: Phaser.GameObjects.Text;
    action = {
        onClick: null
    };
    constructor(scene: Game) {
        const self = this;
        this.sprite = scene.add.text(layout.continueButton.x, layout.continueButton.y, [''])
            .setFontSize(layout.continueButton.fontSize)
            .setFontFamily('Impact')
            .setColor('#eeeeaa')
            .setAlign('right')
            .setOrigin(1, 0)
            .setInteractive();
        this.sprite.on('pointerdown', () => {
            self.action.onClick();
        });
        this.sprite.on('pointerover', () => {
            self.sprite.setColor('#ff69b4');
        });
        this.sprite.on('pointerout', () => {
            self.sprite.setColor('#eeeeaa');
        });
        this.hide();
    }
    update(scene: Game) {
        if (scene.state.gameResult) {
            this.showGameOver(scene);
        } else if (scene.state.playerPendingAction) {
            if (scene.state.turnPhase == TurnPhase.Build) {
                if (!scene.state.playerIsActive) this.showIntervene(scene);
                else if (scene.state.hasToRetractCards) this.hide();
                else this.showNextPhase(scene);
            } else if (scene.state.turnPhase == TurnPhase.Combat) {
                this.showNextCombatPhase(scene);
            } else {
                this.hide();
            }
        } else {
            this.hide();
        }
    }
    private showNextPhase(scene: Game) {
        const text = scene.plannedBattle.shipIds.length == 0 
                || scene.plannedBattle.type == BattleType.Mission && !FrontendPlannedBattle.cardLimitReached(scene.plannedBattle) ? 
            'Zug beenden' :
            `${scene.plannedBattle.type == BattleType.Mission ? 'Mission' : 'Überfall'} durchführen`;
        this.show(text, () => scene.socket.emit(MsgTypeInbound.Ready, TurnPhase.Build, scene.plannedBattle));
    }
    private showIntervene(scene: Game) {
        let text: string; 
        if (scene.state.battle.type == BattleType.Raid) text = 'Verteidigung beginnen';
        else if (scene.interveneShipIds.length > 0) text = 'Intervenieren';
        else text = 'Überspringen';
        this.show(text, () => scene.socket.emit(MsgTypeInbound.Ready, TurnPhase.Build, scene.interveneShipIds));
    }
    private showNextCombatPhase(scene: Game) {
        this.show('Kampfphase beenden', () => scene.socket.emit(MsgTypeInbound.Ready, TurnPhase.Combat));
    }
    private showGameOver(scene: Game) {
        this.show('Neuen Gegner suchen', () => {
            scene.socket.off(MsgTypeOutbound.State);
            scene.scene.start('Matchmaking');
        });
    }
    private show(text: string, onClickAction: () => void) {
        this.action.onClick = onClickAction;
        this.sprite.setText(text);
        this.sprite.visible = true;
    }
    private hide() {
        this.sprite.visible = false;
    }
}