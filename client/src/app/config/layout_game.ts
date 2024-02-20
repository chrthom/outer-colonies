import { perspectiveConfig } from './perspective';

class LayoutGameConfig {
  readonly cards = {
    defenseIndicator: {
      xOffset: -85,
      yOffsetPlayer: -190,
      yOffsetOpponent: 20,
      yDistance: 50
    },
    perspective: {
      none: Phaser.Math.DegToRad(0),
      neutral: Phaser.Math.DegToRad(-5),
      board: Phaser.Math.DegToRad(-30)
    },
    placement: {
      zoneWidth: perspectiveConfig.toCardXOffset(1530),
      halfZoneWidth: perspectiveConfig.toCardXOffset(680),
      hand: {
        angleStep: 5,
        startAngle: -10,
        xStep: perspectiveConfig.toCardXOffset(-50),
        yStep: perspectiveConfig.toCardYOffset(5)
      },
      mission: {
        x: perspectiveConfig.toCardX(1760),
        y: perspectiveConfig.toCardX(735),
        xDistance: perspectiveConfig.toCardXOffset(20),
        yDistance: perspectiveConfig.toCardXOffset(10)
      },
      player: {
        colony: {
          x: perspectiveConfig.toCardX(120),
          y: perspectiveConfig.toCardY(1205)
        },
        deck: {
          x: perspectiveConfig.toCardX(1930),
          y: perspectiveConfig.toCardY(930)
        },
        discardPile: {
          x: perspectiveConfig.toCardX(2190),
          y: perspectiveConfig.toCardY(930)
        },
        hand: {
          x: perspectiveConfig.toCardX(2370),
          y: perspectiveConfig.toCardY(1220)
        },
        orbit: {
          x: perspectiveConfig.toCardX(120),
          y: perspectiveConfig.toCardY(925)
        },
        neutral: {
          x: perspectiveConfig.toCardX(1000),
          y: perspectiveConfig.toCardY(650)
        }
      },
      opponent: {
        colony: {
          x: perspectiveConfig.toCardX(120),
          y: perspectiveConfig.toCardY(160)
        },
        deck: {
          x: perspectiveConfig.toCardX(1930),
          y: perspectiveConfig.toCardY(345)
        },
        discardPile: {
          x: perspectiveConfig.toCardX(2190),
          y: perspectiveConfig.toCardY(345)
        },
        hand: {
          x: perspectiveConfig.toCardX(2370),
          y: perspectiveConfig.toCardY(65)
        },
        orbit: {
          x: perspectiveConfig.toCardX(120),
          y: perspectiveConfig.toCardY(430)
        },
        neutral: {
          x: perspectiveConfig.toCardX(120),
          y: perspectiveConfig.toCardY(695)
        }
      }
    },
    retractCardButton: {
      xOffset: -45,
      yOffset: -252
    },
    stackYDistance: perspectiveConfig.toCardYOffset(31),
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
      yOffset: -400
    },
    maxedTacticCard: {
      x: 0,
      y: 0
    },
    prompt: {
      box: {
        x: 2850, // -1000
        y: 120
      },
      x: 2875, // -1000
      y: 165
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
