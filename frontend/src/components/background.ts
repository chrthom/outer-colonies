import { layout } from "../config/layout";

interface CornerConfig {
    xLeft: number,
    xRight: number,
    yTop: number,
    yBottom: number
}

export default class Background {
    backgroundImage!: Phaser.GameObjects.Image;
    private zoneMarkers!: Phaser.GameObjects.Group;
    private scene!: Phaser.Scene;
    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.backgroundImage = scene.add.image(0, 0, 'background').setOrigin(0, 0).setAlpha(layout.colors.fadedAlpha);
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
        const addCorner = (x: number, y: number, angle: number, opponent: boolean) =>
            this.scene.add.image(x, y, `zone_corner_${opponent ? 'opponent' : 'player'}`).setAngle(angle);
        const addCorners = (c: CornerConfig, opponent: boolean) => [
            addCorner(c.xLeft, c.yTop, 0, opponent),
            addCorner(c.xRight, c.yTop, 90, opponent),
            addCorner(c.xLeft, c.yBottom, 270, opponent),
            addCorner(c.xRight, c.yBottom, 180, opponent)
        ];
        this.zoneMarkers.addMultiple(
            [ l.pColony, l.pOrbital, l.pNeutral ]
                .flatMap(c => addCorners(c, false))
                .concat([ l.oColony, l.oOrbital ].flatMap(c => addCorners(c, true)))
        );
    }
}
