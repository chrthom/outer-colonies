export class CardImage {
    sprite;
    constructor(scene, x, y, cardId) {
        this.sprite = scene.add.image(x, y, `card_${cardId}`)
            .setCrop(41, 41, 740, 1040)
            .setScale(0.15, 0.15);
    }
    destroy() {
        this.sprite.destroy();
    }
}

export class HandCard extends CardImage {
    index;
    playable;
    constructor(scene, handCardsTotal, hardCardData, onClickAction) {
        const x = 70 + (handCardsTotal <= 8 ? hardCardData.index * 125 : hardCardData.index * 1000 / handCardsTotal);
        super(scene, x, 620, hardCardData.cardId);
        if (hardCardData.playable) {
            this.sprite.setInteractive();
            this.sprite.on('pointerdown', () => {
                onClickAction(hardCardData.index);
            });
        } else this.sprite.alpha = 0.5;
    }
}