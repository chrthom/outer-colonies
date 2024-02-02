class LayoutGameConfig {
  readonly cardStackYDistance = 30;
  readonly cards = {
    scale: {
      min: 0.1,
      normal: 0.25,
      max: 0.75
    },
    damageIndicator: {
      xOffsetPlayer: -75,
      yOffsetPlayer: -265,
      xOffsetOpponent: -75,
      yOffsetOpponent: 265
    },
    defenseIndicator: {
      xOffset: -85,
      yOffsetPlayer: -190,
      yOffsetOpponent: 20,
      yDistance: 50
    },
    retractCardButton: {
      xOffset: -45,
      yOffset: -252
    }
  };
  readonly ui = {
    actionPool: {
      x: 2370,
      y: 1040,
      yDistance: -55
    },
    continueButton: {
      x: 2370,
      y: 60,
      xTextOffset: -120
    },
    countdownIndicator: {
      x: 2350,
      y: 600
    },
    exitButton: {
      x: 2350,
      y: 450,
      xTextOffset: -30,
      yTextOffset: -4,
      yConfirmOffset: 35
    },
    maxCard: {
      x: 2110,
      y: 820
    },
    maxedTacticCard: {
      x: 1200,
      y: 900
    },
    prompt: {
      box: {
        x: 1850,
        y: 120
      },
      x: 1875,
      y: 165
    }
  }
}

export const layoutGameConfig = new LayoutGameConfig();

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
