import { designConfig } from 'src/app/config/design';
import { animationConfig } from '../../config/animation';
import { Coordinates, layoutConfig } from '../../config/layout';
import Game from '../../scenes/game';

export interface CardImageConfig {
  cropped?: boolean;
  isOpponentCard?: boolean;
  perspective?: number;
  z?: number;
}

export interface CardTweenConfig {
  duration: number,
  x: number,
  y: number,
  z?: number,
  xRotation?: number,
  zRotation?: number,
  onComplete?: () => void
}

export default class CardImage {
  image: Phaser.GameObjects.Plane;
  cardId: number;
  ownedByPlayer: boolean;
  protected scene: Game;
  protected imageHighlight: Phaser.GameObjects.Plane;
  private imageMask: Phaser.GameObjects.Plane;
  constructor(scene: Game, x: number, y: number, cardId: number, config?: CardImageConfig) {
    this.scene = scene;
    this.cardId = cardId;
    this.ownedByPlayer = !config?.isOpponentCard;
    this.imageHighlight = scene.add
      .plane(layoutConfig.game.perspective.origin.x, layoutConfig.game.perspective.origin.y, `card_glow${config?.cropped ? '_small' : ''}`)
      .setVisible(false);
    this.imageMask = scene.add
      .plane(layoutConfig.game.perspective.origin.x, layoutConfig.game.perspective.origin.y, `card_mask${config?.cropped ? '_small' : ''}`)
      .setVisible(false);
    this.image = scene.add.plane(layoutConfig.game.perspective.origin.x, layoutConfig.game.perspective.origin.y, `card_${cardId}`).setInteractive();
    this.image.setMask(this.imageMask.createBitmapMask());
    this.setZRotation(config?.isOpponentCard ? 180 : 0)
      .setX(x)
      .setY(y)
      .setZ(config?.z ?? layoutConfig.game.perspective.z.board)
      .setXRotation(config?.perspective ?? layoutConfig.game.cards.perspective.neutral);
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
    this.highlightReset();
    this.tween(
      {
        duration: animationConfig.duration.move,
        x: targetCoordinates.x,
        y: targetCoordinates.y,
        z: layoutConfig.game.perspective.z.board,
        xRotation: layoutConfig.game.cards.perspective.board,
        zRotation: this.shortestAngle(this.ownedByPlayer ? 0 : 180),
        onComplete: () => {
          if (!toDeck) {
            this.scene.getPlayerUI(this.ownedByPlayer).discardPile.update(discardPileIds);
          }
          this.destroy();
        }
      }
    );
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
    this.imageHighlight.setVisible(true).setTint(designConfig.tint.opponent);
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
    this.forAllImages(i => i.modelPosition.x = x);
    return this;
  }
  get x(): number {
    return this.image.modelPosition.x;
  }
  setY(y: number): this {
    this.forAllImages(i => i.modelPosition.y = y);
    return this;
  }
  get y(): number {
    return this.image.modelPosition.y;
  }
  setZ(z: number): this {
    this.forAllImages(i => i.modelPosition.z = z);
    return this;
  }
  get z(): number {
    return this.image.modelPosition.z;
  }
  setDepth(depth: number): this {
    this.forAllImages(i => i.setDepth(depth));
    return this;
  }
  get depth(): number {
    return this.image.depth;
  }
  setXRotation(x: number): this {
    this.forAllImages(i => i.modelRotation.x = x);
    return this;
  }
  get xRotation(): number {
    return this.image.modelRotation.x;
  }
  setZRotation(angle: number): this {
    this.forAllImages(i => i.modelRotation.z = Phaser.Math.DegToRad(angle)); // TODO: Remove conversion
    return this;
  }
  get zRotation(): number {
    return Phaser.Math.RadToDeg(this.image.modelRotation.z); // TODO: Remove conversion
  }
  enableMaximizeOnMouseover() {
    this.disableMaximizeOnMouseover();
    this.image
      .on('pointerover', () => this.scene.obj.maxCard.show(this.cardId))
      .on('pointerout', () => this.scene.obj.maxCard.hide())
      .on('pointermove', () => this.scene.obj.maxCard.updatePosition());
  }
  disableMaximizeOnMouseover() {
    this.image.off('pointerover').off('pointerout').off('pointermove');
  }
  tween(config: CardTweenConfig) {
    const pTweenConfig: Phaser.Types.Tweens.TweenBuilderConfig = {
      targets: [this.image.modelPosition, this.imageHighlight.modelPosition, this.imageMask.modelPosition],
      duration: config.duration
    };
    if (config.x != undefined) pTweenConfig['x'] = config.x;
    if (config.y != undefined) pTweenConfig['y'] = config.y;
    if (config.z != undefined) pTweenConfig['z'] = config.z;
    if (config.onComplete) pTweenConfig.onComplete = config.onComplete;
    this.scene.tweens.add(pTweenConfig);
    const rTweenConfig: Phaser.Types.Tweens.TweenBuilderConfig = {
      targets: [this.image.modelRotation, this.imageHighlight.modelRotation, this.imageMask.modelRotation],
      duration: config.duration
    };
    if (config.xRotation != undefined) rTweenConfig['x'] = config.xRotation;
    if (config.zRotation != undefined) rTweenConfig['z'] = Phaser.Math.DegToRad(config.zRotation); // TODO Remove conversion
    this.scene.tweens.add(rTweenConfig);
  }
  shortestAngle(targetAngle: number): number {
    const deg = Phaser.Math.RadToDeg(this.image.modelRotation.z);
    return deg + Phaser.Math.Angle.ShortestBetween(deg, targetAngle);
  }
  protected get placementConfig() {
    return CardImage.getPlacementConfig(this.ownedByPlayer);
  }
  private forAllImages(f: (i: Phaser.GameObjects.Plane) => void) {
    [this.image, this.imageHighlight, this.imageMask].forEach(f);
  }
  protected static getPlacementConfig(ownedByPlayer: boolean) {
    return ownedByPlayer
      ? layoutConfig.game.cards.placement.player
      : layoutConfig.game.cards.placement.opponent;
  }
}
