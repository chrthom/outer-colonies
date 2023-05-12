import { BattleType, MsgTypeInbound, TurnPhase } from "../../../backend/src/components/config/enums";
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
        if (scene.state.playerPendingAction) {
            if (scene.state.turnPhase == TurnPhase.Build) {
                this.showNextPhase(scene);
            } else {
                this.hide();
            }
        } else {
            this.hide();
        }
    }
    private showNextPhase(scene: Game) {
        const text = scene.plannedBattle.shipIds.length == 0 ? 
            'Zug beenden' : 
            `${scene.plannedBattle.type == BattleType.Mission ? 'Mission' : 'Überfall'} durchführen`;
        this.show(text, () => {
            scene.socket.emit(MsgTypeInbound.Ready, TurnPhase.Build, scene.plannedBattle);
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