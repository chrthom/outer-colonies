import { BackgroundOrb, backgroundConfig } from '../config/background';
import { layoutConfig } from '../config/layout';

interface CornerConfig {
  xLeft: number;
  xRight: number;
  yTop: number;
  yBottom: number;
}

export default class Background {
  private currentRing: number = 0;
  private targetRing?: number;
  private targetOrb?: BackgroundOrb;
  private starsImage!: Phaser.GameObjects.Image;
  private ringImage?: Phaser.GameObjects.Image;
  private orbImage?: Phaser.GameObjects.Image;
  private zoneMarkers!: Phaser.GameObjects.Group;
  private scene!: Phaser.Scene;
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.starsImage = scene.add
      .image(0, 0, 'background')
      .setOrigin(0, 0)
      .setDepth(layoutConfig.depth.background)
      .setAlpha(layoutConfig.colors.fadedAlpha);
    this.zoneMarkers = scene.add.group();
  }
  initInterface() {
    const l = {
      pColony: layoutConfig.player.colony.corners,
      pOrbital: layoutConfig.player.orbital.corners,
      pNeutral: layoutConfig.player.neutral.corners,
      oColony: layoutConfig.opponent.colony.corners,
      oOrbital: layoutConfig.opponent.orbital.corners
    };
    const addCorner = (x: number, y: number, angle: number, opponent: boolean) =>
      this.scene.add.image(x, y, `zone_corner_${opponent ? 'opponent' : 'player'}`).setAngle(angle);
    const addCaption = (c: CornerConfig, caption: string, opponent: boolean) =>
      this.scene.add
        .text(c.xLeft, c.yBottom, caption)
        .setFontSize(layoutConfig.font.size)
        .setFontFamily(layoutConfig.font.captionFamily)
        .setColor(opponent ? layoutConfig.opponent.color : layoutConfig.player.color)
        .setAlpha(layoutConfig.colors.alpha)
        .setAlign('right')
        .setOrigin(0, 1);
    const addZoneElements = (c: CornerConfig, opponent: boolean) => [
      addCorner(c.xLeft, c.yTop, 0, opponent),
      addCorner(c.xRight, c.yTop, 90, opponent),
      addCorner(c.xLeft, c.yBottom, 270, opponent),
      addCorner(c.xRight, c.yBottom, 180, opponent)
    ];
    const corners: Phaser.GameObjects.GameObject[] = [
      addZoneElements(l.pColony, false),
      addZoneElements(l.pOrbital, false),
      addZoneElements(l.pNeutral, false),
      addZoneElements(l.oColony, true),
      addZoneElements(l.oOrbital, true)
    ].flat();
    const captions: Phaser.GameObjects.GameObject[] = [
      addCaption(l.pColony, 'Koloniezone', false),
      addCaption(l.pOrbital, 'Orbitale Zone', false),
      addCaption(l.pNeutral, 'Neutrale Zone', false),
      addCaption(l.oColony, 'Koloniezone', true),
      addCaption(l.oOrbital, 'Orbitale Zone', true)
    ];
    this.zoneMarkers.addMultiple(corners.concat(captions));
  }
  moveToOrb(orb: string, ownOrb: boolean) {
    this.targetOrb = backgroundConfig.orbs.find(o => o.name == orb);
    this.moveToRing(this.targetOrb.ring);
  }
  moveToRing(ring: number) {
    this.targetRing = ring;
    this.tween(true);
  }
  private tween(initial: boolean) {
    const movingInwards = this.targetRing < this.currentRing;
    let nextRing = this.currentRing;
    if (this.ringImage) {
      if (initial && this.targetRing == this.currentRing) {
        this.tweenRingFinal(this.ringImage);
      } else {
        this.tweenOut(this.ringImage, movingInwards);
        this.ringImage = undefined;
      }
    } else if (this.targetRing != this.currentRing) {
      nextRing = movingInwards ? this.currentRing - 1 : this.currentRing + 1;
      this.tweenStars(nextRing);
      const nextRingImage = this.createRing(nextRing, movingInwards);
      if (nextRing == this.targetRing) {
        this.ringImage = nextRingImage;
        this.tweenRingFinal(nextRingImage);
      } else {
        this.tweenOut(nextRingImage, movingInwards);
      }
    }
    if (nextRing != this.targetRing) {
      setTimeout(() => {
        this.currentRing = nextRing;
        console.log(`Ring = ${this.currentRing}`);
        this.tween(false);
      }, backgroundConfig.animation.durationNextRing);
    }
  }

  private tweenStars(ring: number) {
    const y =
      -Math.floor(
        (backgroundConfig.animation.starsHeight - layoutConfig.scene.height) /
          (backgroundConfig.rings.length - 1)
      ) * ring;
    this.scene.tweens.add({
      targets: this.starsImage,
      duration: backgroundConfig.animation.duration,
      y: y
    });
  }

  private createRing(ring: number, movingInwards: boolean): Phaser.GameObjects.Image {
    const [x, y] = movingInwards ? this.inCoordinates : this.outCoordinates;
    return this.scene.add
      .image(x, y, `background_ring_${backgroundConfig.rings[ring]}`)
      .setOrigin(0.5, 0.5)
      .setAngle(Math.random() * 360)
      .setDepth(layoutConfig.depth.background + backgroundConfig.depth.ring + ring)
      .setScale(movingInwards ? backgroundConfig.animation.smallScale : backgroundConfig.animation.bigScale);
  }

  private tweenOut(image: Phaser.GameObjects.Image, movingInwards: boolean) {
    const [x, y] = movingInwards ? this.outCoordinates : this.inCoordinates;
    this.scene.tweens.add({
      targets: image,
      duration: backgroundConfig.animation.duration,
      ease: movingInwards ? 'Quint.easeIn' : 'Quint',
      x: x,
      y: y,
      scale: movingInwards ? backgroundConfig.animation.bigScale : backgroundConfig.animation.smallScale,
      onComplete: () => image.destroy()
    });
  }

  private tweenRingFinal(image: Phaser.GameObjects.Image) {
    this.scene.tweens.add({
      targets: image,
      duration: backgroundConfig.animation.duration,
      ease: 'Quint',
      x: Math.random() * layoutConfig.scene.width,
      y: Math.random() * layoutConfig.scene.height,
      scale: Math.max(
        backgroundConfig.animation.minRingScale,
        Math.random() * backgroundConfig.animation.finalScaleFactor
      )
    });
  }

  private get randomBoolean(): boolean {
    return Math.random() < 0.5;
  }

  private get inCoordinates(): [number, number] {
    return [layoutConfig.scene.width / 2, layoutConfig.scene.height / 2];
  }

  private get outCoordinates(): [number, number] {
    const xIsOff = this.randomBoolean;
    const offAxisFactor = this.randomBoolean ? 1 : -1;
    let x: number;
    let y: number;
    if (xIsOff) {
      x = this.randomBoolean
        ? layoutConfig.scene.width + backgroundConfig.animation.offDistance
        : -backgroundConfig.animation.offDistance;
      y = (Math.random() - 0.25) * 2 * layoutConfig.scene.height;
    } else {
      y = this.randomBoolean
        ? layoutConfig.scene.width + backgroundConfig.animation.offDistance
        : -backgroundConfig.animation.offDistance;
      x = (Math.random() - 0.25) * 2 * layoutConfig.scene.width;
    }
    return [x, y];
  }
}
