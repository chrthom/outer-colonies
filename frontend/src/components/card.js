const layout = {
    xPadding: 70,
    defaultDistance: 125,
    stackDistance: 30,
    hand: {
        y: 700,
        defaultThreshold: 8,
        maxWidth: 1000
    },
    zones: {
        defaultThreshold: 10,
        maxWidth: 1250
    },
    zoneY: {
        player: {
            colony: 540,
            orbital: 380,
            neutral: 220
        },
        opponent: {
            colony: 10,
            orbital: 170,
            neutral: 220
        }
    }
}

export class CardImage {
    sprite;
    constructor(scene, x, y, cardId, opponentCard) {
        this.sprite = scene.add.image(x, y, `card_${cardId}`)
            .setCrop(41, 41, 740, 1040)
            .setScale(0.12, 0.12)
            .setInteractive();
        if (opponentCard) this.sprite.setAngle(180);
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
    ownedByPlayer;
    damage;
    constructor(scene, uuid, cardIds, zone, onClickAction, index, zoneCardsNum, ownedByPlayer, damage) {
        const self = this;
        const x = layout.xPadding + (
            zoneCardsNum <= layout.zones.defaultThreshold ? 
            index * layout.defaultDistance : 
            index * layout.zones.maxWidth / zoneCardsNum
        );
        const y = layout.zoneY[ownedByPlayer ? 'player' : 'opponent'][zone]; // TODO: Adjust y for multiple cards in stack
        this.cards = cardIds.map((id, index) => new CardImage(scene, x, y, id, !ownedByPlayer));
        this.cards.forEach((c) => {
            c.sprite.setInteractive();
            c.sprite.on('pointerdown', () => {
                onClickAction(self);
            });
        });
        this.uuid = uuid;
        this.zone = zone;
        this.ownedByPlayer = ownedByPlayer;
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