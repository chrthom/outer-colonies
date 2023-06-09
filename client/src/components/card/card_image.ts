import { animationConfig } from "../../config/animation";
import { layout } from "../../config/layout";
import Game from "../../scenes/game";

export default class CardImage {
    image!: Phaser.GameObjects.Image;
    cardId!: number;
    protected scene!: Game;
    private imageHighlight!: Phaser.GameObjects.Image;
    private imageMask!: Phaser.GameObjects.Image;
    constructor(scene: Game, x: number, y: number, cardId: number, opponentCard?: boolean, scale?: number) {
        this.scene = scene;
        this.cardId = cardId;
        const setImageProps = (image: Phaser.GameObjects.Image) => image
            .setOrigin(0.5, 1)
            .setAngle(opponentCard ? 180 : 0)
            .setScale(scale ? scale : layout.cards.scale.normal);
        this.imageHighlight = setImageProps(scene.add
            .image(x, y, 'card_glow')
            .setVisible(false)
        );
        this.image = setImageProps(scene.add
            .image(x, y, `card_${cardId}`)
            .setCrop(41, 41, 740, 1040)
            .setInteractive()
        );
        this.imageMask = setImageProps(scene.add
            .image(x, y, 'card_mask')
            .setVisible(false)
        );
        this.image.setMask(this.imageMask.createBitmapMask());
    }
    destroy() {
        this.image.destroy();
        this.imageHighlight.destroy();
        this.imageMask.destroy();
    }
    discard(ownedByPlayer: boolean, toDeck?: boolean) {
        const discardPileIds = this.scene.state.discardPileIds.slice();
        this.setDepth(layout.depth.discardCard);
        this.tween({
            targets: undefined,
            duration: animationConfig.duration.move,
            x: toDeck ? layout.deck.x : layout.discardPile.x,
            y: ownedByPlayer ? (toDeck ? layout.deck.y : layout.discardPile.y) : layout.discardPile.yOpponent,
            angle: ownedByPlayer ? 0 : 180,
            scale: layout.cards.scale.normal,
            onComplete: () => {
                if (ownedByPlayer && !toDeck) this.scene.obj.discardPile.update(discardPileIds);
                this.destroy();
            }
        });
    }
    showAndDiscardTacticCard(ownedByPlayer: boolean) {
        this.setDepth(layout.depth.maxedTacticCard);
        this.highlightReset();
        this.tween({
            targets: undefined,
            duration: animationConfig.duration.showTacticCard,
            x: layout.maxedTacticCard.x,
            y: layout.maxedTacticCard.y,
            angle: 0,
            scale: layout.maxedTacticCard.scale,
            completeDelay: animationConfig.duration.waitBeforeDiscard,
            onComplete: () => {
                this.discard(ownedByPlayer);
            }
        });
    }
    highlightDisabled() {
        this.highlightReset();
        this.image.setTint(layout.colors.fadedTint);
    }
    highlightSelectable() {
        this.highlightReset();
        this.imageHighlight.setVisible(true).setTint(layout.colors.neutral);
    }
    highlightSelected() {
        this.highlightReset();
        this.imageHighlight.setVisible(true).setTint(layout.colors.secondary);
    }
    highlightReset() {
        this.imageHighlight.setVisible(false);
        this.image.setTint(layout.colors.neutral);
    }
    setCardId(cardId: number) {
        this.cardId = cardId;
        const x = this.image.x;
        const y = this.image.y;
        const angle = this.image.angle;
        const scale = this.image.scale;
        this.image.destroy();
        this.image = this.scene.add
            .image(x, y, `card_${cardId}`)
            .setCrop(41, 41, 740, 1040)
            .setOrigin(0.5, 1)
            .setAngle(angle)
            .setScale(scale)
            .setInteractive();
    }
    setVisible(visible: boolean) {
        this.image.setVisible(visible);
        if (!visible) this.imageHighlight.setVisible(visible);
    }
    setX(x: number): this {
        this.forAllImages(i => i.setX(x));
        return this;
    }
    setY(y: number): this {
        this.forAllImages(i => i.setY(y));
        return this;
    }
    setAngle(angle: number): this {
        this.forAllImages(i => i.setAngle(angle));
        return this;
    }
    setDepth(depth: number): this {
        this.forAllImages(i => i.setDepth(depth));
        return this;
    }
    enableMaximizeOnMouseover() {
        this.image.off('pointerover');
        this.image.off('pointerout');
        this.image
            .on('pointerover', () => this.scene.obj.maxCard.show(this.cardId))
            .on('pointerout', () => this.scene.obj.maxCard.hide());
    }
    tween(tweenConfig: Phaser.Types.Tweens.TweenBuilderConfig) {
        tweenConfig.targets = [ this.image, this.imageHighlight, this.imageMask ];
        this.scene.tweens.add(tweenConfig);
    }
    private forAllImages(f: (i: Phaser.GameObjects.Image) => void) {
        [ this.image, this.imageHighlight, this.imageMask ].forEach(f);
    }
}
