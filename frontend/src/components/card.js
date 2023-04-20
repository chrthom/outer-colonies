const layout = {
    stackYDistance: 20,
    player: {
        hand: {
            x: 1300,
            y: 720,
            angleStep: -5,
            xStep: -20,
            yStep: 2,
            startAngle: 10
        },
        colony: {
            x: 50,
            y: 570,
            maxWidth: 500
        },
        orbital: {
            x: 550,
            y: 570,
            maxWidth: 500
        },
        neutral: {
            x: 50,
            y: 360,
            maxWidth: 500
        }
    },
    opponent: {
        hand: {
            x: 1050,
            y: 70,
            maxWidth: 500
        },
        colony: {
            x: 550,
            y: 150,
            maxWidth: 500
        },
        orbital: {
            x: 50,
            y: 150,
            maxWidth: 500
        },
        neutral: {
            x: 550,
            y: 360,
            maxWidth: 500
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
        this.sprite.setTint(0x666666)
    }
    highlightSelected() {
        this.highlightReset();
        this.sprite.setTint(0xff6666, 0xff6666, 0xffffff, 0xffffff);
    }
    highlightReset() {
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
        const invIndex = handCardsNum - handCardData.index - 1;
        const x = layout.player.hand.x + invIndex * layout.player.hand.xStep;
        const y = layout.player.hand.y + invIndex * layout.player.hand.yStep;
        const angle = layout.player.hand.startAngle + invIndex * layout.player.hand.angleStep;
        super(scene, x, y, handCardData.cardId);
        this.sprite.setOrigin(0.5, 1).setAngle(angle);
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
        const zoneLayout = layout[ownedByPlayer ? 'player' : 'opponent'][zone];
        const x = zoneLayout.x + index * zoneLayout.maxWidth / zoneCardsNum;
        const yDistance = layout.stackYDistance * (ownedByPlayer ? 1 : -1);
        this.cards = cardIds.map((id, index) => new CardImage(scene, x, zoneLayout.y + index * yDistance, id, !ownedByPlayer));
        this.cards.forEach((c) => {
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
        });
    }
    highlightSelected() {
        this.cards.forEach((c) => c.highlightSelected());
    }
    highlightReset() {
        this.cards.forEach((c) => {
            c.highlightReset();
        });
    }
}