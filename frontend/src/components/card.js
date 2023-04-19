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
            .setScale(0.15, 0.15)
            .setInteractive();
    }
    destroy() {
        this.sprite.destroy();
    }
    highlightDisabled() {
        this.highlightReset();
        this.sprite.alpha = 0.5;
    }
    highlightSelected() {
        this.highlightReset();
        this.sprite.setTint(0xff6666, 0xff6666, 0xffffff, 0xffffff);
    }
    highlightReset() {
        this.sprite.alpha = 1;
        this.sprite.setTint(0xffffff);
    }
    setClickable(onClickAction, parameter) {
        this.sprite.on('pointerdown', () => {
            onClickAction(parameter);
        });
    }
}

export class HandCard extends CardImage {
    uuid;
    data;
    constructor(scene, handCardsNum, handCardData, onClickAction) {
        const x = layout.xPadding + (
            handCardsNum <= layout.hand.defaultThreshold ? 
            handCardData.index * layout.defaultDistance : 
            handCardData.index * layout.hand.maxWidth / handCardsNum
        );
        super(scene, x, layout.hand.y, handCardData.cardId);
        this.data = handCardData;
        this.uuid = handCardData.uuid;
        if (handCardData.playable) this.setClickable(onClickAction, this);
    }
    highlightPlayability() {
        if (this.data.playable) this.highlightReset();
        else this.highlightDisabled();
    }
}

export class CardStack {
    cards;
    uuid;
    zone;
    ownPlayer;
    damage;
    constructor(scene, uuid, cardIds, zone, onClickAction, index, zoneCardsNum, ownPlayer, damage) {
        const self = this;
        const x = layout.xPadding + (
            zoneCardsNum <= layout.zones.defaultThreshold ? 
            index * layout.defaultDistance : 
            index * layout.zones.maxWidth / zoneCardsNum
        );
        this.cards = cardIds.map((id, index) => new CardImage(scene, x, layout.ownColonyZoneY, id)); // TODO: Adjust y for multiple cards
        this.cards.forEach((c) => {
            c.sprite.setInteractive();
            c.sprite.on('pointerdown', () => {
                onClickAction(self);
            });
        });
        this.uuid = uuid;
        this.zone = zone;
        this.ownPlayer = ownPlayer;
        this.damage = damage;
    }
    destroy() {
        this.cards.forEach((c) => c.destroy());
    }
    highlightDisabled() {
        this.cards.forEach((c) => {
            c.highlightDisabled();
            c.sprite.setInteractive(false);
        });
    }
    highlightSelected() {
        this.cards.forEach((c) => c.highlightSelected());
    }
    highlightReset() {
        this.cards.forEach((c) => {
            c.highlightReset();
            c.sprite.setInteractive();
        });
    }
}