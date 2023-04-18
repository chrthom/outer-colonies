const layout = {
    xPadding: 70,
    defaultDistance: 125,
    stackDistance: 30,
    hand: {
        y: 620,
        defaultThreshold: 8,
        maxWidth: 1000
    },
    zones: {
        defaultThreshold: 10,
        maxWidth: 1250
    },
    ownColonyZoneY: 450
}

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
    highlightDisabled() {
        this.highlightReset();
        this.sprite.alpha = 0.5;
    }
    highlightedTarget() {
        this.highlightReset();
        this.sprite.setTint(0xff6666, 0xff6666, 0xffffff, 0xffffff);
    }
    highlightReset() {
        this.sprite.alpha = 1;
        this.sprite.setTint(0xffffff);
    }
}

export class HandCard extends CardImage {
    index;
    playable;
    constructor(scene, handCards, hardCardData, onClickAction) {
        const x = layout.xPadding + (
            handCards <= layout.hand.defaultThreshold ? 
            hardCardData.index * layout.defaultDistance : 
            hardCardData.index * layout.hand.maxWidth / handCards
        );
        super(scene, x, layout.hand.y, hardCardData.cardId);
        if (hardCardData.playable) {
            this.sprite.setInteractive();
            this.sprite.on('pointerdown', () => {
                onClickAction(hardCardData);
            });
        } else this.highlightDisabled();
    }
}

export class CardStack {
    sprites;
    zone;
    ownPlayer;
    damage;
    constructor(scene, cardIds, zone, index, zoneCards, ownPlayer, damage) {
        const x = layout.xPadding + (
            zoneCards <= layout.zones.defaultThreshold ? 
            index * layout.defaultDistance : 
            index * layout.zones.maxWidth / zoneCards
        );
        this.sprites = cardIds.map((id, index) => new CardImage(scene, x, layout.ownColonyZoneY, id)); // TODO: Adjust y for multiple cards
        this.zone = zone;
        this.ownPlayer = ownPlayer;
        this.damage = damage;
    }
}