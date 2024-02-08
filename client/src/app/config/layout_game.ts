class LayoutGameConfig {
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
      hand: {
        angleStep: -5,
        xStep: -50,
        yStep: 5,
        startAngle: 10
      },
      player: {
        colony: {
          x: 120,
          y: 1365
        },
        deck: {
          x: 1930,
          y: 1070
        },
        discardPile: {
          x: 2190,
          y: 1070
        },
        hand: {
          x: 2370,
          y: 1350
        },
        orbit: {
          x: 120,
          y: 1069
        },
        neutral: {
          x: 1000,
          y: 773
        }
      },
      opponent: {
        colony: {
          x: 120,
          y: -15
        },
        deck: {
          x: 1930,
          y: 205
        },
        discardPile: {
          x: 2190,
          y: 205
        },
        hand: {
          x: 2370,
          y: -75
        },
        orbit: {
          x: 120,
          y: 281
        },
        neutral: {
          x: 120,
          y: 577
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
        y: -100,
        yDistance: 55
      }
    },
    combatRange: {
      x: 1800,
      y: 730
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
      x: 2110,
      y: 1060
    },
    maxedTacticCard: {
      x: 1200,
      y: 900
    },
    missionCards: {
      x: 1760,
      y: 720,
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
        xLeft: 10,
        xRight: 1760,
        yTop: 1094,
        yBottom: 1340
      },
      playerOrbit: {
        xLeft: 10,
        xRight: 1760,
        yTop: 823,
        yBottom: 1069
      },
      neutral: {
        xLeft: 10,
        xRight: 1760,
        yTop: 552,
        yBottom: 798
      },
      opponentColony: {
        xLeft: 10,
        xRight: 1760,
        yTop: 10,
        yBottom: 256
      },
      opponentOrbit: {
        xLeft: 10,
        xRight: 1760,
        yTop: 281,
        yBottom: 527
      }
    }
  };
}

export const layoutGameConfig = new LayoutGameConfig();
