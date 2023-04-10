export default class Card {
    sprite;
    constructor(scene, x, y, sprite) {
        this.sprite = scene.add.image(x, y, `card_${sprite}`)
            .setCrop(41, 41, 740, 1040)
            .setScale(0.15, 0.15)
            .setInteractive();
        //scene.input.setDraggable(card);
    }
}