import {
  CardXPosition,
  CardYPosition,
  ZoomCardXPosition,
  ZoomCardYPosition,
  MinCardXPosition,
  MinCardYPosition
} from '../components/perspective';

class LayoutGameConfig {
  readonly cards = {
    cardsBreakpointYCompression: 5,
    expanded: {
      xFactorMoveToCenter: 0.2,
      xOffset: 90,
      yFactorMoveToCenter: 0.13
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
        yExpand: -65,
        yStep: 5
      },
      mission: {
        x: new MinCardXPosition(1760),
        y: new MinCardYPosition(650),
        xDistance: 20,
        yDistance: 10
      },
      opponent: {
        colony: {
          x: new CardXPosition(120),
          y: new CardYPosition(160)
        },
        deck: {
          x: new CardXPosition(1875),
          y: new CardYPosition(345)
        },
        discardPile: {
          x: new CardXPosition(2080),
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
      },
      player: {
        colony: {
          x: new CardXPosition(120),
          y: new CardYPosition(1205)
        },
        deck: {
          x: new CardXPosition(1985),
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
      randomAngle: 4
    },
    retractCardButton: {
      xOffset: 66,
      yOffset: -87
    },
    stackYDistance: 31,
    summaryBox: {
      boxesPerRow: 4,
      xOffset: 3,
      xStep: 44,
      yOffset: 10,
      yStep: 49
    },
    valueIndicator: {
      xOffsetPlayer: -115,
      yOffsetPlayer: -108,
      xOffsetOpponent: -80,
      yOffsetOpponent: 107
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
        y: 525
      },
      opponent: {
        x: 2325,
        y: 475
      }
    },
    exitButton: {
      x: 2330,
      y: 675,
      xTextOffset: -30,
      yTextOffset: -4,
      yConfirmOffset: 35
    },
    gameOver: {
      yOffsets: {
        title: -100,
        subtitle: -20,
        solGain: {
          winner: 250,
          looser: 200
        }
      }
    },
    maxCard: {
      xOffset: 400,
      yOffset: -330
    },
    maxedTacticCard: {
      x: new ZoomCardXPosition(1200),
      y: new ZoomCardYPosition(650)
    },
    optionPicker: {
      arrowSize: 80,
      cardsXOffset: 750,
      margin: {
        x: 20,
        y: 150
      }
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
