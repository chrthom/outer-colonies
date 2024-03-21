import { BattleType, TurnPhase } from '../../../../server/src/shared/config/enums';
import { BackgroundOrb, backgroundConfig } from '../config/background';
import { designConfig } from '../config/design';
import { Coordinates, layoutConfig } from '../config/layout';
import { perspectiveConfig } from '../config/perspective';
import Game from '../scenes/game';
import Matchmaking from '../scenes/matchmaking';
import { CornerXPosition, CornerYPosition } from './perspective';

interface CoordinatesAndScale extends Coordinates {
  scale: number;
}

export default class Background {
  private scene: Matchmaking | Game;
  private playerOrb!: string;
  private opponentOrb!: string;
  private currentRing = 0;
  private targetRing?: number;
  private targetOrb?: BackgroundOrb;
  private isColonyOrb?: boolean;
  private starsImage: Phaser.GameObjects.Image;
  private sunImage: Phaser.GameObjects.Image;
  private ringImage!: Phaser.GameObjects.Image;
  private orbImage?: Phaser.GameObjects.Image;
  private zoneMarkers: Phaser.GameObjects.Group;

  constructor(scene: Matchmaking | Game) {
    this.scene = scene;
    this.zoneMarkers = scene.add.group();
    this.starsImage = scene.add
      .image(0, this.starsYCorrdinates(this.currentRing), 'background')
      .setOrigin(0)
      .setDepth(layoutConfig.depth.background)
      .setAlpha(designConfig.alpha.faded);
    const sunCoordinates = this.sunCoordinatesAndScale(this.currentRing);
    this.sunImage = scene.add
      .image(sunCoordinates.x, sunCoordinates.y, 'background_sun')
      .setDepth(layoutConfig.depth.background + 1)
      .setScale(sunCoordinates.scale);
    if (this.isGame) {
      this.playerOrb = this.randomElement(backgroundConfig.defaultBackgroundOrbNames);
      this.opponentOrb = this.randomElement(
        backgroundConfig.defaultBackgroundOrbNames.filter(o => o != this.playerOrb)
      );
      this.ringImage = this.createRing(this.currentRing, false);
      const randomAnimation = () => {
        if (!this.targetRing) {
          this.animateRandomObjects();
          this.animateRandomCombatEffects();
        }
        this.scene.time.delayedCall(backgroundConfig.animation.randomEventInterval, randomAnimation);
      };
      randomAnimation();
    }
  }

  initInterface() {
    const zConf = layoutConfig.game.ui.zones;
    const addCaption = (c: Coordinates, caption: string, color: string) =>
      this.scene.add
        .text(c.x, c.y, caption)
        .setFontSize(layoutConfig.fontSize.giant)
        .setFontFamily(designConfig.fontFamily.caption)
        .setColor(color)
        .setAlpha(designConfig.alpha.transparent)
        .setOrigin(0.5)
        .setAlign('center');
    const addCorner = (x: number, y: number, z: number, angle: number, tint: number) => {
      const corner = this.scene.add
        .plane(perspectiveConfig.origin.x, perspectiveConfig.origin.y, 'zone_corner')
        .setTint(tint);
      corner.modelPosition.x = new CornerXPosition(x).value3d;
      corner.modelPosition.y = new CornerYPosition(y).value3d;
      corner.modelPosition.z = z;
      corner.modelRotation.x = layoutConfig.game.cards.perspective.board;
      corner.modelRotation.z = Phaser.Math.DegToRad(angle);
      return corner;
    };
    const addZone = (c: Coordinates, tint: number, index: number) => {
      return [
        addCorner(
          c.x - zConf.width / 2 + index * zConf.offset.xTop,
          c.y - zConf.height / 2,
          (index + 1) * zConf.offset.z,
          0,
          tint
        ),
        addCorner(
          c.x + zConf.width / 2 - index * zConf.offset.xTop,
          c.y - zConf.height / 2,
          (index + 1) * zConf.offset.z,
          270,
          tint
        ),
        addCorner(
          c.x - zConf.width / 2 + (index - 1) * zConf.offset.xTop + zConf.offset.xBottom,
          c.y + zConf.height / 2,
          index * zConf.offset.z,
          90,
          tint
        ),
        addCorner(
          c.x + zConf.width / 2 - (index - 1) * zConf.offset.xTop - zConf.offset.xBottom,
          c.y + zConf.height / 2,
          index * zConf.offset.z,
          180,
          tint
        )
      ];
    };
    const corners: Phaser.GameObjects.GameObject[] = [
      addZone(zConf.playerColony, designConfig.tint.player, 1),
      addZone(zConf.playerOrbit, designConfig.tint.player, 2),
      addZone(zConf.neutral, designConfig.tint.neutral, 3),
      addZone(zConf.opponentColony, designConfig.tint.opponent, 5),
      addZone(zConf.opponentOrbit, designConfig.tint.opponent, 4)
    ].flat();
    const captions: Phaser.GameObjects.GameObject[] = [
      addCaption(zConf.playerColony, 'Koloniezone', designConfig.color.player),
      addCaption(zConf.playerOrbit, 'Orbitale Zone', designConfig.color.player),
      addCaption(zConf.neutral, 'Neutrale Zone', designConfig.color.neutral),
      addCaption(zConf.opponentColony, 'Koloniezone', designConfig.color.opponent),
      addCaption(zConf.opponentOrbit, 'Orbitale Zone', designConfig.color.opponent)
    ];
    this.zoneMarkers.addMultiple(corners.concat(captions));
  }

  update() {
    this.checkPlayerOrbs();
    if (this.isGame) {
      const state = this.game.state;
      if (this.inCombatRaid) {
        if (this.isColonyOrb != !state.playerIsActive) {
          this.moveToOrb(state.playerIsActive ? this.opponentOrb : this.playerOrb, !state.playerIsActive);
        }
      } else if (this.inCombat) {
        if (this.isColonyOrb != undefined) {
          if (this.randomBoolean()) {
            this.moveToRing(this.randomIndex(backgroundConfig.rings));
          } else {
            this.moveToOrb(this.randomElement(backgroundConfig.orbs).name);
          }
        }
      } else if (this.inStartOrBuildPhase && this.isColonyOrb != state.playerIsActive) {
        this.moveToOrb(state.playerIsActive ? this.playerOrb : this.opponentOrb, state.playerIsActive);
      }
    }
  }

  private moveToOrb(orb: string, playerOrb?: boolean) {
    const backgroundOrb = backgroundConfig.orbs.find(o => o.name == orb);
    if (backgroundOrb) {
      this.targetOrb = backgroundOrb;
      this.isColonyOrb = playerOrb;
      this.moveToRing(this.targetOrb.ring);
    }
  }

  private moveToRing(ring: number) {
    const alreadyInTransit = this.targetRing != undefined;
    this.targetRing = ring;
    if (!alreadyInTransit) this.tween(true);
  }

  private tween(initial: boolean) {
    if (this.targetRing) {
      if (initial) {
        this.tweenOutCurrentObjects();
        this.tweenStars();
        this.tweenSun();
      } else {
        if (this.targetOrb && this.nextRing == this.targetRing) {
          this.createOrbAndTweenToPosition(this.movingInwards);
        }
        if (this.currentRing != this.targetRing) {
          this.tweenRing();
        }
      }
      if (!initial) {
        this.currentRing = this.nextRing;
      }
      if (initial || this.currentRing != this.targetRing) {
        this.scene.time.delayedCall(backgroundConfig.animation.durationNextRing, () => this.tween(false));
      } else {
        this.targetRing = undefined;
        this.targetOrb = undefined;
      }
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
    if (this.targetRing) {
      this.scene.tweens.add({
        targets: this.starsImage,
        duration:
          backgroundConfig.animation.durationNextRing * Math.abs(this.targetRing - this.currentRing) +
          backgroundConfig.animation.durationObjectTransition,
        y: this.starsYCorrdinates(this.targetRing),
        ease: 'Quad.inOut'
      });
    }
  }

  private tweenSun() {
    if (this.targetRing) {
      const c = this.sunCoordinatesAndScale(this.targetRing);
      this.scene.tweens.add({
        targets: this.sunImage,
        duration:
          backgroundConfig.animation.durationNextRing * Math.abs(this.targetRing - this.currentRing) +
          backgroundConfig.animation.durationObjectTransition,
        x: c.x,
        y: c.y,
        scale: c.scale,
        ease: 'Quad.inOut'
      });
    }
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
    const c = movingInwards ? this.inCoordinates : this.outCoordinates;
    const angle = Math.random() * 360 - 45;
    return this.scene.add
      .image(c.x, c.y, `background_ring_${backgroundConfig.rings[ring]}`)
      .setOrigin(0.5)
      .setAngle(angle)
      .setDepth(layoutConfig.depth.background + backgroundConfig.depth.ring + ring)
      .setScale(movingInwards ? backgroundConfig.animation.smallScale : backgroundConfig.animation.bigScale)
      .setTint(...this.getTint(angle));
  }

  private createOrbAndTweenToPosition(movingInwards: boolean) {
    if (this.targetOrb) {
      let c: Coordinates;
      if (movingInwards) c = this.inCoordinates;
      else {
        c = {
          x: this.outCoordinates.x,
          y: this.isColonyOrb
            ? layoutConfig.scene.height + backgroundConfig.animation.offDistance
            : -backgroundConfig.animation.offDistance
        };
      }
      this.orbImage = this.scene.add
        .image(c.x, c.y, `background_orb_${this.targetOrb.name}`)
        .setOrigin(0.5)
        .setDepth(layoutConfig.depth.background + backgroundConfig.depth.orb)
        .setScale(movingInwards ? backgroundConfig.animation.smallScale : backgroundConfig.animation.bigScale)
        .setTint(...this.getTint(this.isColonyOrb ? 0 : 270));
      this.tweenOrbToPosition();
    }
  }

  private tweenOrbToPosition() {
    this.scene.tweens.add({
      targets: this.orbImage,
      duration: backgroundConfig.animation.durationObjectTransition,
      ease: 'Quint',
      x: backgroundConfig.animation.orbX,
      y: this.isColonyOrb
        ? backgroundConfig.animation.orbYPlayer
        : this.isColonyOrb == undefined
        ? layoutConfig.scene.height / 2
        : backgroundConfig.animation.orbYOpponent,
      scale: backgroundConfig.animation.orbScale
    });
  }

  private tweenOut(image: Phaser.GameObjects.Image, movingInwards: boolean) {
    let c: Coordinates;
    if (movingInwards) {
      c = {
        x: image.x + (image.x - layoutConfig.scene.width / 2) * 4,
        y:
          image.y < layoutConfig.scene.height / 2
            ? -backgroundConfig.animation.offDistance
            : layoutConfig.scene.height + backgroundConfig.animation.offDistance
      };
    } else {
      c = this.inCoordinates;
    }
    this.scene.tweens.add({
      targets: image,
      duration: backgroundConfig.animation.durationObjectTransition,
      ease: movingInwards ? 'Quad.easeIn' : 'Quint',
      x: c.x,
      y: c.y,
      scale: movingInwards ? backgroundConfig.animation.bigScale : backgroundConfig.animation.smallScale,
      onComplete: () => image.destroy()
    });
  }

  private tweenRingToPosition() {
    this.scene.tweens.add({
      targets: this.ringImage,
      duration: backgroundConfig.animation.durationObjectTransition,
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

  private getTint(angle: number): [number, number, number, number] {
    const tintCorner = (corner: number) =>
      angle >= (corner - 0.5) * 90 && angle < (corner + 0.5) * 90
        ? designConfig.tint.neutral
        : designConfig.tint.faded;
    return <[number, number, number, number]>[0, 2, 3, 1].map(tintCorner);
  }

  private animateRandomObjects() {
    backgroundConfig.randomVessels
      .filter(rv => !rv.combatOnly || this.inCombat)
      .filter(rv => !rv.orbitOnly || this.orbImage)
      .filter(rv => this.randomBoolean(rv.probability))
      .forEach(rv => {
        const vessel = this.scene.add
          .image(rv.startX, rv.startY, `background_vessel_${rv.vessel}`)
          .setOrigin(0.5)
          .setDepth(layoutConfig.depth.background + backgroundConfig.depth.vessel)
          .setScale(rv.startScale ? rv.startScale : 1)
          .setAngle(rv.startAngle ? rv.startAngle : 0)
          .setTint(...this.getTint(rv.startAngle ? rv.startAngle : 0));
        this.scene.tweens.add({
          targets: vessel,
          duration: backgroundConfig.animation.durationNextRing,
          ease: rv.ease ? rv.ease : 'Linear',
          x: rv.endX,
          y: rv.endY,
          scale: rv.endScale ? rv.endScale : rv.startScale ? rv.startScale : 1,
          angle: rv.endAngle ? rv.endAngle : rv.startAngle ? rv.startAngle : 0,
          onComplete: () => vessel.destroy()
        });
      });
  }

  private animateRandomCombatEffects() {
    if (this.inCombat) {
      for (let i = 0; i < backgroundConfig.randomCombatEffects.multiplier; i++) {
        if (this.randomBoolean(backgroundConfig.randomCombatEffects.autogun.probability)) {
          this.scene.time.delayedCall(Math.random() * backgroundConfig.animation.randomEventInterval, () =>
            this.createAutogunFire()
          );
        }
        if (this.randomBoolean(backgroundConfig.randomCombatEffects.laser.probability)) {
          this.scene.time.delayedCall(Math.random() * backgroundConfig.animation.randomEventInterval, () =>
            this.createLaserFire()
          );
        }
        if (this.randomBoolean(backgroundConfig.randomCombatEffects.explosion.probability)) {
          this.scene.time.delayedCall(Math.random() * backgroundConfig.animation.randomEventInterval, () =>
            this.createExplosion()
          );
        }
      }
    }
  }

  private createAutogunFire() {
    const conf = backgroundConfig.randomCombatEffects.autogun;
    const endScale = Math.pow(Math.random() * conf.maxScale, 2);
    const duration = (Math.random() + 0.5) * conf.duration;
    const emitter = this.scene.add
      .particles(
        layoutConfig.scene.width * Math.random(),
        layoutConfig.scene.height * Math.random(),
        'flare_yellow',
        {
          duration: duration,
          lifespan: conf.lifetime,
          gravityX: (Math.random() - 0.5) * conf.speed * endScale,
          gravityY: (Math.random() - 0.5) * conf.speed * endScale,
          frequency: conf.frequency,
          speed: { min: 0, max: conf.spread },
          scale: { start: Math.pow((Math.random() * conf.maxScale) / 2, 2), end: endScale },
          blendMode: 'ADD',
          emitting: true
        }
      )
      .setDepth(layoutConfig.depth.background + backgroundConfig.depth.effects);
    this.scene.time.delayedCall(duration + conf.lifetime, () => emitter.destroy());
  }

  private createLaserFire() {
    const conf = backgroundConfig.randomCombatEffects.laser;
    const x = layoutConfig.scene.width * Math.random();
    const y = layoutConfig.scene.height * Math.random();
    const line = this.scene.add
      .line(
        0,
        0,
        x,
        y,
        x + conf.range * (Math.random() - 0.5),
        y + conf.range * (Math.random() - 0.5),
        0xffffff,
        conf.alpha
      )
      .setDepth(layoutConfig.depth.background + backgroundConfig.depth.effects);
    line.postFX.addGlow(this.randomElement(conf.colors));
    this.scene.tweens.add({
      targets: line,
      duration: conf.duration,
      alpha: 0,
      onComplete: () => line.destroy()
    });
  }

  private createExplosion() {
    const conf = backgroundConfig.randomCombatEffects.explosion;
    const lifetime = (Math.random() + 0.5) * conf.duration;
    const scale = Math.random() * conf.maxScale;
    const emitter = this.scene.add
      .particles(
        layoutConfig.scene.width * Math.random(),
        layoutConfig.scene.height * Math.random(),
        `flare_${this.randomElement(conf.colors)}`,
        {
          lifespan: lifetime,
          speed: { min: 0, max: conf.maxSpeed * scale },
          scale: { start: 0.01, end: scale },
          alpha: { start: 1, end: 0 },
          blendMode: 'ADD',
          emitting: false
        }
      )
      .setDepth(layoutConfig.depth.background + backgroundConfig.depth.effects);
    emitter.explode(Number(Math.random() * (conf.maxParticles - conf.minParticles) + conf.minParticles));
    this.scene.time.delayedCall(lifetime, () => emitter.destroy());
  }

  private randomBoolean(chance?: number): boolean {
    return Math.random() < (chance ? chance : 0.5);
  }

  private randomElement<T>(array: T[]): T {
    return array[this.randomIndex(array)];
  }

  private randomIndex(array: any[]): number {
    return Math.floor(Math.random() * array.length);
  }

  private sunCoordinatesAndScale(ring: number): CoordinatesAndScale {
    return {
      x: (layoutConfig.scene.width * ring) / backgroundConfig.rings.length / 2,
      y: (layoutConfig.scene.height * (1 + ring / backgroundConfig.rings.length)) / 4,
      scale: 2 / (Math.pow(ring, 2) + 1)
    };
  }

  private starsYCorrdinates(ring: number): number {
    return (
      -Math.floor(
        (backgroundConfig.animation.starsHeight - layoutConfig.scene.height) /
          (backgroundConfig.rings.length - 1)
      ) * ring
    );
  }

  private checkPlayerOrbs() {
    this.game.state.cardStacks
      .filter(cs => cs.cards.slice(-1).pop()?.id == 0)
      .forEach(cs => {
        const orb = backgroundConfig.orbs.find(o => o.cardId == cs.cards[0].id);
        if (orb) {
          if (cs.ownedByPlayer) this.playerOrb = orb.name;
          else this.opponentOrb = orb.name;
        }
      });
  }

  private get inCoordinates(): Coordinates {
    return {
      x: layoutConfig.scene.width / 2,
      y: layoutConfig.scene.height / 2
    };
  }

  private get movingInwards(): boolean {
    return (this.targetRing ?? -1) < this.currentRing;
  }

  private get nextRing(): number {
    return this.targetRing == this.currentRing
      ? this.targetRing
      : this.movingInwards
      ? this.currentRing - 1
      : this.currentRing + 1;
  }

  private get outCoordinates(): Coordinates {
    const xIsOff = this.randomBoolean();
    let x: number;
    let y: number;
    if (xIsOff) {
      x = this.randomBoolean()
        ? layoutConfig.scene.width + backgroundConfig.animation.offDistance
        : -backgroundConfig.animation.offDistance;
      y = (Math.random() - 0.25) * 2 * layoutConfig.scene.height;
    } else {
      y = this.randomBoolean()
        ? layoutConfig.scene.width + backgroundConfig.animation.offDistance
        : -backgroundConfig.animation.offDistance;
      x = (Math.random() - 0.25) * 2 * layoutConfig.scene.width;
    }
    return {
      x: x,
      y: y
    };
  }

  private get isGame(): boolean {
    return this.game.gameParams !== undefined;
  }

  private get game(): Game {
    return <Game>this.scene;
  }

  private get inCombat(): boolean {
    return this.isGame && this.game.state && this.game.state.turnPhase == TurnPhase.Combat;
  }

  private get inCombatRaid(): boolean {
    return this.inCombat && this.game.state.battle && this.game.state.battle.type == BattleType.Raid;
  }

  private get inStartOrBuildPhase(): boolean {
    return (
      (this.isGame && this.game.state && this.game.state.turnPhase == TurnPhase.Start) ||
      this.game.state.turnPhase == TurnPhase.Build
    );
  }
}
