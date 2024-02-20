import { designConfig } from 'src/app/config/design';
import { animationConfig } from '../../config/animation';
import { Coordinates, layoutConfig } from '../../config/layout';
import Game from '../../scenes/game';

export interface CardImageConfig {
  isOpponentCard?: boolean;
  cropped?: boolean;
  scale?: number;
}

export default class CardImage {
  image: Phaser.GameObjects.Image;
  cardId: number;
  ownedByPlayer: boolean;
  protected scene: Game;
  protected imageHighlight: Phaser.GameObjects.Image;
  private imageMask: Phaser.GameObjects.Image;
  constructor(scene: Game, x: number, y: number, cardId: number, config?: CardImageConfig) {
    this.scene = scene;
    this.cardId = cardId;
    this.ownedByPlayer = !config?.isOpponentCard;
    const setImageProps = (image: Phaser.GameObjects.Image) =>
      image
        .setOrigin(0.5, 1)
        .setAngle(config?.isOpponentCard ? 180 : 0)
        .setScale(config?.scale ?? layoutConfig.game.cards.scale.normal);
    this.imageHighlight = setImageProps(
      scene.add.image(x, y, `card_glow${config?.cropped ? '_small' : ''}`).setVisible(false)
    );
    this.image = setImageProps(
      scene.add
        .image(x, y, `card_${cardId}`)
        .setCrop(
          layoutConfig.game.cards.size.normal.x,
          layoutConfig.game.cards.size.normal.y,
          layoutConfig.game.cards.size.normal.width,
          layoutConfig.game.cards.size.normal.height
        )
        .setInteractive({
          useHandCursor: true
        })
    );
    this.imageMask = setImageProps(
      scene.add.image(x, y, `card_mask${config?.cropped ? '_small' : ''}`).setVisible(false)
    );
    this.image.setMask(this.imageMask.createBitmapMask());
  }
  destroy() {
    this.image.destroy();
    this.imageHighlight.destroy();
    this.imageMask.destroy();
  }
  discard(toDeck?: boolean) {
    const discardPileIds = this.scene.getPlayerState(this.ownedByPlayer).discardPileIds.slice();
    this.setDepth(layoutConfig.depth.discardCard);
    const placementConfig = layoutConfig.game.cards.placement;
    const targetPlayerConfig = this.ownedByPlayer ? placementConfig.player : placementConfig.opponent;
    const targetCoordinates: Coordinates = toDeck ? targetPlayerConfig.deck : targetPlayerConfig.discardPile;
    this.tween({
      targets: undefined,
      duration: animationConfig.duration.move,
      x: targetCoordinates.x,
      y: targetCoordinates.y,
      angle: this.shortestAngle(this.ownedByPlayer ? 0 : 180),
      scale: layoutConfig.game.cards.scale.normal,
      onComplete: () => {
        if (!toDeck) {
          this.scene.getPlayerUI(this.ownedByPlayer).discardPile.update(discardPileIds);
        }
        this.destroy();
      }
    });
  }
  highlightDisabled() {
    this.highlightReset();
    this.image.setTint(designConfig.tint.faded);
  }
  highlightSelectable() {
    this.highlightReset();
    this.imageHighlight.setVisible(true).setTint(designConfig.tint.neutral);
  }
  highlightSelected() {
    this.highlightReset();
    this.imageHighlight.setVisible(true).setTint(designConfig.tint.secondary);
  }
  highlightReset() {
    this.imageHighlight.setVisible(false);
    this.image.setTint(designConfig.tint.neutral);
  }
  setCardId(cardId: number): this {
    this.cardId = cardId;
    this.image.setTexture(`card_${cardId}`);
    return this;
  }
  setVisible(visible: boolean): this {
    this.image.setVisible(visible);
    if (!visible) this.imageHighlight.setVisible(visible);
    return this;
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
  setScale(scale: number): this {
    this.forAllImages(i => i.setScale(scale));
    return this;
  }
  enableMaximizeOnMouseover() {
    this.image
      .off('pointerover')
      .on('pointerover', () => this.scene.obj.maxCard.show(this.cardId))
      .off('pointerout')
      .on('pointerout', () => this.scene.obj.maxCard.hide())
      .off('pointermove')
      .on('pointermove', () => this.scene.obj.maxCard.updatePosition());
  }
  tween(tweenConfig: Phaser.Types.Tweens.TweenBuilderConfig) {
    tweenConfig.targets = [this.image, this.imageHighlight, this.imageMask];
    this.scene.tweens.add(tweenConfig);
  }
  shortestAngle(targetAngle: number): number {
    return this.image.angle + Phaser.Math.Angle.ShortestBetween(this.image.angle, targetAngle);
  }
  get placementConfig() {
    return CardImage.getPlacementConfig(this.ownedByPlayer);
  }
  private forAllImages(f: (i: Phaser.GameObjects.Image) => void) {
    [this.image, this.imageHighlight, this.imageMask].forEach(f);
  }
  protected static getPlacementConfig(ownedByPlayer: boolean) {
    return ownedByPlayer
      ? layoutConfig.game.cards.placement.player
      : layoutConfig.game.cards.placement.opponent;
  }
}
