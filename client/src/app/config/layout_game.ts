import { CardXPosition, CardYPosition, MinCardXPosition, MinCardYPosition } from '../components/perspective';

class LayoutGameConfig {
  readonly cards = {
    defenseIndicator: {
      xOffset: -85,
      yDistance: 50
    },
    perspective: {
      none: Phaser.Math.DegToRad(0),
      neutral: Phaser.Math.DegToRad(-5),
      board: Phaser.Math.DegToRad(-30)
    },
    placement: {
      zoneWidth: 1530,
      halfZoneWidth: 680,
      hand: {
        angleStep: 5,
        startAngle: -10,
        xStep: -50,
        yStep: 5
      },
      mission: {
        x: new MinCardXPosition(1760),
        y: new MinCardYPosition(650),
        xDistance: 20,
        yDistance: 10
      },
      player: {
        colony: {
          x: new CardXPosition(120),
          y: new CardYPosition(1205)
        },
        deck: {
          x: new CardXPosition(1930),
          y: new CardYPosition(930)
        },
        discardPile: {
          x: new CardXPosition(2190),
          y: new CardYPosition(930)
        },
        hand: {
          x: new CardXPosition(2370),
          y: new CardYPosition(1220)
        },
        orbit: {
          x: new CardXPosition(120),
          y: new CardYPosition(925)
        },
        neutral: {
          x: new CardXPosition(1000),
          y: new CardYPosition(650)
        }
      },
      opponent: {
        colony: {
          x: new CardXPosition(120),
          y: new CardYPosition(160)
        },
        deck: {
          x: new CardXPosition(1930),
          y: new CardYPosition(345)
        },
        discardPile: {
          x: new CardXPosition(2190),
          y: new CardYPosition(345)
        },
        hand: {
          x: new CardXPosition(2370),
          y: new CardYPosition(65)
        },
        orbit: {
          x: new CardXPosition(120),
          y: new CardYPosition(430)
        },
        neutral: {
          x: new CardXPosition(120),
          y: new CardYPosition(695)
        }
      }
    },
    retractCardButton: {
      xOffset: 67,
      yOffset: -88
    },
    stackYDistance: 31,
    valueIndicator: {
      xOffsetPlayer: -95,
      yOffsetPlayer: -100,
      xOffsetOpponent: -65,
      yOffsetOpponent: 95
    }
  };
  readonly ui = {
    actionPool: {
      player: {
        x: 2370,
        y: 1040,
        yDistance: -55
      },
      opponent: {
        x: 2370,
        y: 235,
        yDistance: 55
      }
    },
    combatRange: {
      x: 1855,
      y: 600
    },
    continueButton: {
      x: 2370,
      y: 600,
      xTextOffset: -120
    },
    countdownIndicator: {
      player: {
        x: 2325,
        y: 675
      },
      opponent: {
        x: 2325,
        y: 525
      }
    },
    exitButton: {
      x: 2330,
      y: 735,
      xTextOffset: -30,
      yTextOffset: -4,
      yConfirmOffset: 35
    },
    maxCard: {
      xOffset: 400,
      yOffset: -330
    },
    maxedTacticCard: {
      x: new CardXPosition(1200),
      y: new CardYPosition(650)
    },
    prompt: {
      textOffset: {
        x: 25,
        y: 45
      },
      x: 1840,
      y: 630
    },
    zones: {
      height: 240,
      width: 1750,
      offset: {
        xTop: 18,
        xBottom: 4,
        z: -0.1
      },
      playerColony: {
        x: 885,
        y: 1217
      },
      playerOrbit: {
        x: 885,
        y: 946
      },
      neutral: {
        x: 885,
        y: 675
      },
      opponentColony: {
        x: 885,
        y: 133
      },
      opponentOrbit: {
        x: 885,
        y: 404
      }
    }
  };
}

export const layoutGameConfig = new LayoutGameConfig();

export type CardPosition = {
  x: CardXPosition;
  y: CardYPosition;
};
