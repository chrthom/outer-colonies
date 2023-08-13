import { BackgroundOrb, backgroundConfig } from '../config/background';
import { layoutConfig } from '../config/layout';

interface CornerConfig {
  xLeft: number;
  xRight: number;
  yTop: number;
  yBottom: number;
}

export default class Background {
  private currentRing: number = 2;
  private targetRing?: number;
  private targetOrb?: BackgroundOrb;
  private playerOrb?: boolean;
  private starsImage!: Phaser.GameObjects.Image;
  private sunImage!: Phaser.GameObjects.Image;
  private ringImage!: Phaser.GameObjects.Image;
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
    this.sunImage = scene.add
      .image(
        this.sunCoordinatesAndScale(this.currentRing)[0],
        this.sunCoordinatesAndScale(this.currentRing)[1],
        'background_sun'
      )
      .setOrigin(0.5, 0.5)
      .setDepth(layoutConfig.depth.background + 1)
      .setScale(this.sunCoordinatesAndScale(this.currentRing)[2]);
    this.ringImage = this.createRing(this.currentRing, false);
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

  moveToOrb(orb: string, playerOrb: boolean) {
    this.targetOrb = backgroundConfig.orbs.find(o => o.name == orb);
    this.playerOrb = playerOrb;
    this.moveToRing(this.targetOrb.ring);
  }

  moveToRing(ring: number) {
    this.targetRing = ring;
    this.tween(true);
  }

  private tween(initial: boolean) {
    const movingInwards = this.targetRing < this.currentRing;
    if (initial) {
      this.tweenOutCurrentObjects();
    } else {
      this.tweenStars();
      this.tweenSun();
      if (this.targetOrb && this.nextRing == this.targetRing) {
        this.createOrbAndTweenToPosition(movingInwards);
      }
      if (this.currentRing != this.targetRing) {
        this.tweenRing();
      }
    }
    if (!initial) {
      this.currentRing = this.nextRing;
    }
    if (initial || this.currentRing != this.targetRing) {
      setTimeout(() => this.tween(false), backgroundConfig.animation.durationNextRing);
    } else {
      this.targetRing = undefined;
      this.targetOrb = undefined;
    }
  }

  private tweenOutCurrentObjects() {
    if (this.orbImage) {
      this.tweenOut(this.orbImage, this.targetRing == this.currentRing || this.movingInwards);
      this.orbImage = undefined;
    }
    if (this.targetRing == this.currentRing) {
      this.tweenRingToPosition();
    } else {
      this.tweenOut(this.ringImage, this.movingInwards);
    }
  }

  private tweenStars() {
    const y =
      -Math.floor(
        (backgroundConfig.animation.starsHeight - layoutConfig.scene.height) /
          (backgroundConfig.rings.length - 1)
      ) * this.nextRing;
    this.scene.tweens.add({
      targets: this.starsImage,
      duration: backgroundConfig.animation.duration,
      y: y
    });
  }

  private tweenSun() {
    this.scene.tweens.add({
      targets: this.sunImage,
      duration: backgroundConfig.animation.duration,
      x: this.sunCoordinatesAndScale(this.nextRing)[0],
      y: this.sunCoordinatesAndScale(this.nextRing)[1],
      scale: this.sunCoordinatesAndScale(this.nextRing)[2]
    });
  }

  private tweenRing() {
    const nextRingImage = this.createRing(this.nextRing, this.movingInwards);
    if (this.nextRing == this.targetRing) {
      this.ringImage = nextRingImage;
      this.tweenRingToPosition();
    } else {
      this.tweenOut(nextRingImage, this.movingInwards);
    }
  }

  private createRing(ring: number, movingInwards: boolean): Phaser.GameObjects.Image {
    const [x, y] = movingInwards ? this.inCoordinates : this.outCoordinates;
    const angle = Math.random() * 360 - 45;
    return this.scene.add
      .image(x, y, `background_ring_${backgroundConfig.rings[ring]}`)
      .setOrigin(0.5, 0.5)
      .setAngle(angle)
      .setDepth(layoutConfig.depth.background + backgroundConfig.depth.ring + ring)
      .setScale(movingInwards ? backgroundConfig.animation.smallScale : backgroundConfig.animation.bigScale)
      .setTint(...this.getTint(angle));
  }

  private createOrbAndTweenToPosition(movingInwards: boolean) {
    const [x, y] = movingInwards ? this.inCoordinates : this.outCoordinates;
    this.orbImage = this.scene.add
      .image(x, y, `background_orb_${this.targetOrb.name}`)
      .setOrigin(0.5, 0.5)
      .setDepth(layoutConfig.depth.background + backgroundConfig.depth.orb)
      .setScale(movingInwards ? backgroundConfig.animation.smallScale : backgroundConfig.animation.bigScale)
      .setTint(...this.getTint(this.playerOrb ? 0 : 270));
    this.tweenOrbToPosition();
  }

  private tweenOut(image: Phaser.GameObjects.Image, movingInwards: boolean) {
    const [x, y] = movingInwards ? this.outCoordinates : this.inCoordinates;
    this.scene.tweens.add({
      targets: image,
      duration: backgroundConfig.animation.duration,
      ease: movingInwards ? 'Quad.easeIn' : 'Quint',
      x: x,
      y: y,
      scale: movingInwards ? backgroundConfig.animation.bigScale : backgroundConfig.animation.smallScale,
      onComplete: () => image.destroy()
    });
  }

  private tweenRingToPosition() {
    this.scene.tweens.add({
      targets: this.ringImage,
      duration: backgroundConfig.animation.duration,
      ease: 'Quint',
      x: Math.random() * layoutConfig.scene.width,
      y: Math.random() * layoutConfig.scene.height,
      scale: this.targetOrb
        ? this.targetOrb.distance
        : Math.max(
            backgroundConfig.animation.minRingScale,
            Math.random() * backgroundConfig.animation.ringMaxScale
          )
    });
  }

  private tweenOrbToPosition() {
    this.scene.tweens.add({
      targets: this.orbImage,
      duration: backgroundConfig.animation.duration,
      ease: 'Quint',
      x: backgroundConfig.animation.orbX,
      y: this.playerOrb ? backgroundConfig.animation.orbYPlayer : backgroundConfig.animation.orbYOpponent,
      scale: backgroundConfig.animation.orbScale
    });
  }

  private getTint(angle: number): [number, number, number, number] {
    const tintCorner = (corner: number) =>
      angle >= (corner - 0.5) * 90 && angle < (corner + 0.5) * 90
        ? layoutConfig.colors.neutral
        : layoutConfig.colors.fadedTint;
    return <[number, number, number, number]>[0, 2, 3, 1].map(tintCorner);
  }

  private get randomBoolean(): boolean {
    return Math.random() < 0.5;
  }

  private get inCoordinates(): [number, number] {
    return [layoutConfig.scene.width / 2, layoutConfig.scene.height / 2];
  }

  private get movingInwards(): boolean {
    return this.targetRing < this.currentRing;
  }

  private get nextRing(): number {
    return this.targetRing == this.currentRing
      ? this.targetRing
      : this.movingInwards
      ? this.currentRing - 1
      : this.currentRing + 1;
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

  private sunCoordinatesAndScale(ring: number): [number, number, number] {
    return [
      (layoutConfig.scene.width * ring) / backgroundConfig.rings.length / 2,
      (layoutConfig.scene.height * (1 + ring / backgroundConfig.rings.length)) / 4,
      2 / (Math.pow(ring, 2) + 1)
    ];
  }
}
