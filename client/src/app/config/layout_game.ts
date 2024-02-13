class LayoutGameConfig {
  readonly perspective = {
    none: Phaser.Math.DegToRad(0),
    neutral: Phaser.Math.DegToRad(-10),
    board: Phaser.Math.DegToRad(-30)
  };
  readonly cards = {
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
    placement: {
      zoneWidth: 1530,
      halfZoneWidth: 650,
      hand: {
        angleStep: -5,
        xStep: -50,
        yStep: 5,
        startAngle: 10
      },
      player: {
        colony: {
          x: 120,
          y: 1220
        },
        deck: {
          x: 1930,
          y: 930
        },
        discardPile: {
          x: 2190,
          y: 930
        },
        hand: {
          x: 2370,
          y: 1220
        },
        orbit: {
          x: 120,
          y: 934
        },
        neutral: {
          x: 1000,
          y: 658
        }
      },
      opponent: {
        colony: {
          x: 120,
          y: 130
        },
        deck: {
          x: 1930,
          y: 345
        },
        discardPile: {
          x: 2190,
          y: 345
        },
        hand: {
          x: 2370,
          y: 65
        },
        orbit: {
          x: 120,
          y: 416
        },
        neutral: {
          x: 120,
          y: 692
        }
      }
    },
    retractCardButton: {
      xOffset: -45,
      yOffset: -252
    },
    scale: {
      min: 0.1,
      normal: 0.25,
      max: 0.75
    },
    size: {
      original: {
        width: 822,
        height: 1122
      },
      normal: {
        x: 41,
        y: 41,
        width: 740,
        height: 1040
      }
    },
    stackYDistance: 38
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
      xOffset: 350,
      yOffset: -320
    },
    maxedTacticCard: {
      x: 1200,
      y: 675
    },
    missionCards: {
      x: 1760,
      y: 735,
      xDistance: 20,
      yDistance: 10
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
