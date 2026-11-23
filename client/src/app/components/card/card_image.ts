import { designConfig } from 'src/app/config/design';
import { animationConfig } from '../../config/animation';
import { layoutConfig } from '../../config/layout';
import Game from '../../scenes/game';
import { perspectiveConfig } from 'src/app/config/perspective';
import { CardPosition, CardXPosition, CardYPosition, PerspectivePosition } from '../perspective';

export interface CardImageConfig {
  cropped?: boolean;
  isOpponentCard?: boolean;
  perspective?: number;
  z?: number;
}

export interface CardTweenConfig {
  duration: number;
  x: CardXPosition;
  y: CardYPosition;
  z?: number;
  xRotation?: number;
  angle?: number;
  onComplete?: () => void;
}

export default class CardImage {
  image: Phaser.GameObjects.Plane;
  cardId: number;
  ownedByPlayer: boolean;
  protected scene: Game;
  private imageHighlight: Phaser.GameObjects.Plane;
  private imageMask: Phaser.GameObjects.Plane;
  private imagePile: Phaser.GameObjects.Plane;
  private positionTween?: Phaser.Tweens.Tween;
  private rotationTween?: Phaser.Tweens.Tween;
  private discarding = false;
  constructor(
    scene: Game,
    x: PerspectivePosition,
    y: PerspectivePosition,
    cardId: number,
    config?: CardImageConfig
  ) {
    this.scene = scene;
    this.cardId = cardId;
    this.ownedByPlayer = !config?.isOpponentCard;
    this.imagePile = scene.add
      .plane(perspectiveConfig.origin.x, perspectiveConfig.origin.y, 'card_pile_1')
      .setVisible(false);
    this.imageHighlight = scene.add
      .plane(
        perspectiveConfig.origin.x,
        perspectiveConfig.origin.y,
        `card_glow${config?.cropped ? '_small' : ''}`
      )
      .setVisible(false);
    this.imageMask = scene.add
      .plane(
        perspectiveConfig.origin.x,
        perspectiveConfig.origin.y,
        `card_mask${config?.cropped ? '_small' : ''}`
      )
      .setVisible(false);
    this.image = scene.add
      .plane(perspectiveConfig.origin.x, perspectiveConfig.origin.y, `card_${cardId}`)
      .setInteractive({
        useHandCursor: true
      });
    this.image.setMask(this.imageMask.createBitmapMask());
    this.setAngle(config?.isOpponentCard ? 180 : 0)
      .setX(x)
      .setY(y)
      .setZ(config?.z ?? perspectiveConfig.distance.board)
      .setXRotation(config?.perspective ?? layoutConfig.game.cards.perspective.neutral);
  }
  destroy(): this {
    this.rotationTween?.stop();
    this.positionTween?.stop();
    this.image.destroy();
    this.imageHighlight.destroy();
    this.imageMask.destroy();
    this.imagePile.destroy();
    return this;
  }
  /**
   * Animates this card to a deck (retract) or discard pile and destroys its planes on completion.
   * @param toDeck true if the card moves to the deck (retracted), false/undefined for the discard pile
   * @param targetOwnedByPlayer whether the destination deck/discard pile belongs to the local player;
   * defaults to `this.ownedByPlayer`, and can be overridden for attachments on opponent stacks
   */
  discard(toDeck?: boolean, targetOwnedByPlayer: boolean = this.ownedByPlayer): this {
    if (this.discarding) return this;
    this.image.disableInteractive(true);
    const discardPileIds = this.scene.getPlayerState(targetOwnedByPlayer).discardPileIds.slice();
    this.setDepth(layoutConfig.depth.discardCard);
    const placementConfig = layoutConfig.game.cards.placement;
    const targetPlayerConfig = targetOwnedByPlayer ? placementConfig.player : placementConfig.opponent;
    const targetCoordinates: CardPosition = toDeck ? targetPlayerConfig.deck : targetPlayerConfig.discardPile;
    this.highlightReset();
    this.tween({
      duration: animationConfig.duration.move,
      x: targetCoordinates.x,
      y: targetCoordinates.y,
      z: perspectiveConfig.distance.board,
      xRotation: layoutConfig.game.cards.perspective.board,
      angle: this.shortestAngle(targetOwnedByPlayer ? 0 : 180),
      onComplete: () => {
        if (!toDeck) {
          this.scene.getPlayerUI(targetOwnedByPlayer).discardPile.update(discardPileIds);
        }
        this.destroy();
      }
    });
    // Mark after starting the discard tween so no subsequent hover/un-expand tween can overwrite it
    this.discarding = true;
    return this;
  }
  highlightDisabled(): this {
    this.highlightReset();
    this.image.setTint(designConfig.tint.faded);
    return this;
  }
  highlightSelectable(): this {
    this.highlightReset();
    this.imageHighlight.setVisible(true).setTint(designConfig.tint.neutral);
    return this;
  }
  highlightSelected(): this {
    this.highlightReset();
    this.imageHighlight.setVisible(true).setTint(designConfig.tint.opponent);
    return this;
  }
  highlightReset(): this {
    this.imageHighlight.setVisible(false);
    this.image.setTint(designConfig.tint.neutral);
    return this;
  }
  setCardId(cardId: number): this {
    this.cardId = cardId;
    this.image.setTexture(`card_${cardId}`);
    return this;
  }
  setPileSize(size: number) {
    let imageNum = 0;
    if (size > 55) imageNum = 4;
    else if (size > 30) imageNum = 3;
    else if (size > 15) imageNum = 2;
    else if (size > 5) imageNum = 1;
    this.imagePile.setVisible(imageNum > 0);
    this.imagePile.setTexture(`card_pile_${imageNum}`);
  }
  setVisible(visible: boolean): this {
    this.image.setVisible(visible);
    if (!visible) this.imageHighlight.setVisible(visible);
    return this;
  }
  setX(x: PerspectivePosition): this {
    this.forAllImages(i => (i.modelPosition.x = x.value3d));
    return this;
  }
  get x(): CardXPosition {
    return new CardXPosition(this.image.modelPosition.x, true);
  }
  setY(y: PerspectivePosition): this {
    this.forAllImages(i => (i.modelPosition.y = y.value3d));
    return this;
  }
  get y(): CardYPosition {
    return new CardYPosition(this.image.modelPosition.y, true);
  }
  setZ(z: number): this {
    this.forAllImages(i => (i.modelPosition.z = z));
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
  /** Brings the planes to the top of the display list in creation order to restore the card's render order within its stack. */
  bringPlanesToTop(): this {
    [this.imagePile, this.imageHighlight, this.imageMask, this.image].forEach(p =>
      this.scene.children.bringToTop(p)
    );
    return this;
  }
  setXRotation(x: number): this {
    this.forAllImages(i => (i.modelRotation.x = x));
    return this;
  }
  get xRotation(): number {
    return this.image.modelRotation.x;
  }
  setAngle(angle: number): this {
    this.forAllImages(i => (i.modelRotation.z = Phaser.Math.DegToRad(angle)), true);
    return this;
  }
  get angle(): number {
    return Phaser.Math.RadToDeg(this.image.modelRotation.z);
  }
  enableMaximizeOnRightclick(): this {
    this.image
      .on('pointerdown', (p: Phaser.Input.Pointer) => {
        if (p.rightButtonDown()) {
          const maxCard = this.scene.obj.zoomCard;
          if (maxCard.image.visible) this.scene.obj.zoomCard.hide();
          else this.scene.obj.zoomCard.show(this.cardId);
        }
      })
      .on('pointerout', () => this.scene.obj.zoomCard.hide())
      .on('pointermove', () => this.scene.obj.zoomCard.updatePosition());
    return this;
  }
  tween(config: CardTweenConfig) {
    if (this.discarding) return;
    this.positionTween?.stop();
    const pTweenConfig: Phaser.Types.Tweens.TweenBuilderConfig = {
      targets: [this.image.modelPosition, this.imageHighlight.modelPosition, this.imageMask.modelPosition],
      duration: config.duration,
      ease: 'Cubic.easeInOut'
    };
    if (config.x != undefined) pTweenConfig['x'] = config.x.value3d;
    if (config.y != undefined) pTweenConfig['y'] = config.y.value3d;
    if (config.z != undefined) pTweenConfig['z'] = config.z;
    if (config.onComplete) pTweenConfig.onComplete = config.onComplete;
    if (config.xRotation != undefined || config.angle != undefined) {
      this.rotationTween?.stop();
      const rTweenConfig: Phaser.Types.Tweens.TweenBuilderConfig = {
        targets: [this.image.modelRotation, this.imageHighlight.modelRotation, this.imageMask.modelRotation],
        duration: config.duration,
        ease: 'Quad.easeInOut'
      };
      if (config.xRotation != undefined) rTweenConfig['x'] = config.xRotation;
      if (config.angle != undefined) rTweenConfig['z'] = Phaser.Math.DegToRad(config.angle);
      this.rotationTween = this.scene.tweens.add(rTweenConfig);
    }
    this.positionTween = this.scene.tweens.add(pTweenConfig);
  }
  shortestAngle(targetAngle: number): number {
    const deg = Phaser.Math.RadToDeg(this.image.modelRotation.z);
    return deg + Phaser.Math.Angle.ShortestBetween(deg, targetAngle);
  }
  get placementConfig() {
    return CardImage.getPlacementConfig(this.ownedByPlayer);
  }
  private forAllImages(f: (i: Phaser.GameObjects.Plane) => void, excludePile?: boolean) {
    [this.image, this.imageHighlight, this.imageMask].concat(excludePile ? [] : [this.imagePile]).forEach(f);
  }
  protected static getPlacementConfig(ownedByPlayer: boolean) {
    return ownedByPlayer
      ? layoutConfig.game.cards.placement.player
      : layoutConfig.game.cards.placement.opponent;
  }
}
