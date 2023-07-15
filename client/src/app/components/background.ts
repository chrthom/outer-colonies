import { layout } from '../config/layout';

interface CornerConfig {
  xLeft: number;
  xRight: number;
  yTop: number;
  yBottom: number;
}

export default class Background {
  backgroundImage!: Phaser.GameObjects.Image;
  private zoneMarkers!: Phaser.GameObjects.Group;
  private scene!: Phaser.Scene;
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.backgroundImage = scene.add
      .image(0, 0, 'background')
      .setOrigin(0, 0)
      .setAlpha(layout.colors.fadedAlpha);
    this.zoneMarkers = scene.add.group();
  }
  initInterface() {
    const l = {
      pColony: layout.player.colony.corners,
      pOrbital: layout.player.orbital.corners,
      pNeutral: layout.player.neutral.corners,
      oColony: layout.opponent.colony.corners,
      oOrbital: layout.opponent.orbital.corners,
    };
    const addCorner = (
      x: number,
      y: number,
      angle: number,
      opponent: boolean,
    ) =>
      this.scene.add
        .image(x, y, `zone_corner_${opponent ? 'opponent' : 'player'}`)
        .setAngle(angle);
    const addCaption = (c: CornerConfig, caption: string, opponent: boolean) =>
      this.scene.add
        .text(c.xLeft, c.yBottom, caption)
        .setFontSize(layout.font.size)
        .setFontFamily(layout.font.captionFamily)
        .setColor(opponent ? layout.opponent.color : layout.player.color)
        .setAlpha(layout.colors.alpha)
        .setAlign('right')
        .setOrigin(0, 1);
    const addZoneElements = (c: CornerConfig, opponent: boolean) => [
      addCorner(c.xLeft, c.yTop, 0, opponent),
      addCorner(c.xRight, c.yTop, 90, opponent),
      addCorner(c.xLeft, c.yBottom, 270, opponent),
      addCorner(c.xRight, c.yBottom, 180, opponent),
    ];
    const corners: Phaser.GameObjects.GameObject[] = [
      addZoneElements(l.pColony, false),
      addZoneElements(l.pOrbital, false),
      addZoneElements(l.pNeutral, false),
      addZoneElements(l.oColony, true),
      addZoneElements(l.oOrbital, true),
    ].flat();
    const captions: Phaser.GameObjects.GameObject[] = [
      addCaption(l.pColony, 'Koloniezone', false),
      addCaption(l.pOrbital, 'Orbitale Zone', false),
      addCaption(l.pNeutral, 'Neutrale Zone', false),
      addCaption(l.oColony, 'Koloniezone', true),
      addCaption(l.oOrbital, 'Orbitale Zone', true),
    ];
    this.zoneMarkers.addMultiple(corners.concat(captions));
  }
}
