import { layoutGameConfig } from "./layout_game";
import { layoutLoadConfig } from "./layout_load";

export class FontSizeConfig {
  readonly small = 20;
  readonly normal = 28;
  readonly large = 36;
}

class LayoutConfig {
  readonly load = layoutLoadConfig;
  readonly game = layoutGameConfig;

  readonly depth = {
    background: -1000,
    indicators: 20,
    discardCard: 50,
    handCard: 70,
    battleEffects: 85,
    maxedTacticCard: 100
  };

  readonly fontSize = new FontSizeConfig();

  readonly scene = {
    height: 1350,
    width: 2400
  };

  

  readonly ui = {
    combatRange: {
      x: 1760,
      y: 730
    },
    deck: {
      x: 1930,
      y: 1070
    },
    discardPile: {
      x: 2190,
      y: 1070,
      yOpponent: -400
    },
    missionCards: {
      x: 1760,
      y: 650,
      xDistance: 20,
      yDistance: 10
    }
  }
  readonly opponent: FactionLayout = {
    color: '#991111',
    colony: {
      x: 120,
      y: 100,
      maxWidth: 650,
      corners: {
        xLeft: 10,
        xRight: 873,
        yTop: 10,
        yBottom: 373
      }
    },
    orbital: {
      x: 1000,
      y: 100,
      maxWidth: 650,
      corners: {
        xLeft: 897,
        xRight: 1760,
        yTop: 10,
        yBottom: 373
      }
    },
    neutral: {
      x: 120,
      y: 670,
      maxWidth: 650,
      corners: {
        // TODO: Not used
        xLeft: 10,
        xRight: 1760,
        yTop: 397,
        yBottom: 953
      }
    }
  };
  readonly player: FactionLayoutPlayer = {
    color: '#119999',
    hand: {
      x: 2370,
      y: 1350,
      angleStep: -5,
      xStep: -50,
      yStep: 5,
      startAngle: 10
    },
    colony: {
      x: 1000,
      y: 1250,
      maxWidth: 650,
      corners: {
        xLeft: 897,
        xRight: 1760,
        yTop: 977,
        yBottom: 1340
      }
    },
    orbital: {
      x: 120,
      y: 1250,
      maxWidth: 650,
      corners: {
        xLeft: 10,
        xRight: 873,
        yTop: 977,
        yBottom: 1340
      }
    },
    neutral: {
      x: 1000,
      y: 670,
      maxWidth: 650,
      corners: {
        xLeft: 10,
        xRight: 1760,
        yTop: 397,
        yBottom: 953
      }
    }
  };
}

interface FactionLayout {
  color: string;
  colony: FactionLayoutZone;
  orbital: FactionLayoutZone;
  neutral: FactionLayoutZone;
}

interface FactionLayoutPlayer extends FactionLayout {
  hand: FactionLayoutHand;
}

interface FactionLayoutElement {
  x: number;
  y: number;
}

interface FactionLayoutHand extends FactionLayoutElement {
  angleStep: number;
  xStep: number;
  yStep: number;
  startAngle: number;
}

export interface FactionLayoutZone extends FactionLayoutElement {
  maxWidth: number;
  corners: FactionLayoutZoneCorners;
}

interface FactionLayoutZoneCorners {
  xLeft: number;
  xRight: number;
  yTop: number;
  yBottom: number;
}

export const layoutConfig = new LayoutConfig();
