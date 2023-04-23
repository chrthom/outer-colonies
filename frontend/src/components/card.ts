import { FrontendHandCard } from "../../../backend/src/components/frontend_converters/frontend_state";
import Layout from "../config/layout";
import Game from "../scenes/game";
import { Zone } from "../../../backend/src/components/config/enums";

const layout = new Layout();

export class CardImage {
    sprite: Phaser.GameObjects.Image;
    cardId: string;
    constructor(scene: Game, x: number, y: number, cardId: string, opponentCard?: boolean, scale?: number) {
        this.cardId = cardId;
        this.sprite = scene.add.image(x, y, `card_${cardId}`)
            .setCrop(41, 41, 740, 1040)
            .setOrigin(0.5, 1)
            .setScale(scale ? scale : layout.cards.scale)
            .setInteractive();
        if (opponentCard) this.sprite.setAngle(180);
        this.sprite.on('pointerover', (pointer) => {
            scene.obj.maxCard.show(cardId);
        })
        this.sprite.on('pointerout', (pointer) => {
            scene.obj.maxCard.hide();
        })
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
    setClickable<T>(onClickAction: (p: T) => void, parameter: T) {
        this.sprite.on('pointerdown', () => {
            onClickAction(parameter);
        });
    }
}

export class HandCard extends CardImage {
    uuid: string;
    data: FrontendHandCard;
    constructor(
        scene: Game, 
        handCardsNum: number, 
        handCardData: FrontendHandCard, 
        onClickAction: (c: HandCard) => void
    ) {
        const invIndex = handCardsNum - handCardData.index - 1;
        const x = layout.player.hand.x + invIndex * layout.player.hand.xStep;
        const y = layout.player.hand.y + invIndex * layout.player.hand.yStep;
        const angle = layout.player.hand.startAngle + invIndex * layout.player.hand.angleStep;
        super(scene, x, y, handCardData.cardId);
        this.sprite.setAngle(angle);
        this.data = handCardData;
        this.uuid = handCardData.uuid;
        if (handCardData.playable) this.setClickable(onClickAction, this);
    }
    highlightPlayability() {
        if (this.data.playable) this.highlightReset();
        else this.highlightDisabled();
    }
}

export class MaxCard extends CardImage {
    constructor(scene: Game) {
        super(scene, layout.maxCard.x, layout.maxCard.y, 'back', false, layout.maxCard.scale);
        this.hide();
    }
    hide() {
        this.sprite.visible = false;
    }
    show(cardId: string) {
        this.sprite.setTexture(`card_${cardId}`);
        this.sprite.visible = true;
    }
}

export class DeckCard extends CardImage {
    constructor(scene: Game) {
        super(scene, layout.deck.x, layout.deck.y, 'back');
    }
}

export class CardStack {
    cards: Array<CardImage>;
    uuid: string;
    zone: Zone;
    ownedByPlayer: boolean;
    damage: number;
    constructor(
        scene: Game, 
        uuid: string, 
        cardIds: Array<string>, 
        zone: Zone, 
        onClickAction: (cs: CardStack) => void, 
        index: number, 
        zoneCardsNum: number, 
        ownedByPlayer: boolean, 
        damage: number
    ) {
        const self = this;
        const zoneLayout = layout[ownedByPlayer ? 'player' : 'opponent'][zone];
        const x = zoneLayout.x + (zoneCardsNum == 1 ? zoneLayout.maxWidth / 2 : index * zoneLayout.maxWidth / (zoneCardsNum - 1));
        const yDistance = layout.stackYDistance * (ownedByPlayer ? 1 : -1);
        console.log(`New Card Stack ${cardIds} | ${ownedByPlayer} | ${x} | ${zoneLayout.y}`); ////
        this.cards = cardIds.map((id, index) => new CardImage(scene, x, zoneLayout.y + index * yDistance, id, !ownedByPlayer));
        this.cards.forEach(c => {
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
        this.cards.forEach(c => c.destroy());
    }
    highlightDisabled() {
        this.cards.forEach(c => {
            c.highlightDisabled();
        });
    }
    highlightSelected() {
        this.cards.forEach(c => c.highlightSelected());
    }
    highlightReset() {
        this.cards.forEach(c => {
            c.highlightReset();
        });
    }
}