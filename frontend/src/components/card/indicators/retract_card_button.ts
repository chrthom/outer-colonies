import { MsgTypeInbound } from "../../../../../backend/src/components/config/enums";
import Layout from "../../../config/layout";
import Game from "../../../scenes/game";

const layout = new Layout();

export default class RetractCardButton {
    sprite: Phaser.GameObjects.Image;
    constructor(scene: Game, cardX: number, cardY: number, cardStackUUID: string, cardIndex: number, crititcal: boolean) {
        this.sprite = scene.add
            .image(
                cardX + layout.cards.retractCardButton.xOffset,
                cardY + layout.cards.retractCardButton.yOffset,
                `icon_retract_card`
            )
            .setOrigin(0.5, 0.5)
            .setAlpha(layout.colors.alpha)
            .setInteractive()
            .on('pointerover', () => this.setTintHover())
            .on('pointerout', () => crititcal ? this.setTintCritical : this.setTintNormal())
            .on('pointerdown', () => scene.socket.emit(MsgTypeInbound.Retract, cardStackUUID, cardIndex));
        crititcal ? this.setTintCritical() : this.setTintNormal();
    }
    destroy() {
        this.sprite.destroy();
    }
    setTintNormal() {
        this.sprite.setTint(layout.colors.primary, layout.colors.neutral, layout.colors.primary, layout.colors.primary);
    }
    setTintCritical() {
        this.sprite.setTint(layout.colors.secondary, layout.colors.neutral, layout.colors.secondary, layout.colors.secondary);
    }
    setTintHover() {
        this.sprite.setTint(layout.colors.neutral);
    }
}