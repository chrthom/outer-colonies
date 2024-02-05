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
      zoneWidth: 650,
      hand: {
        angleStep: -5,
        xStep: -50,
        yStep: 5,
        startAngle: 10
      },
      player: {
        colony: {
          x: 1000,
          y: 1250
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
          y: 1250
        },
        neutral: {
          x: 1000,
          y: 670
        }
      },
      opponent: {
        colony: {
          x: 120,
          y: 100
        },
        deck: {
          x: 1930,
          y: -300
        },
        discardPile: {
          x: 2190,
          y: -300
        },
        hand: {
          x: 2370,
          y: -580
        },
        orbit: {
          x: 1000,
          y: 100
        },
        neutral: {
          x: 120,
          y: 670
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
    stackYDistance: 35
  };
  readonly fixed = {
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
  };
  readonly ui = {
    combatRange: {
      x: 1760,
      y: 730
    },
    missionCards: {
      x: 1760,
      y: 650,
      xDistance: 20,
      yDistance: 10
    },
    zones: {
      playerColony: {
        xLeft: 897,
        xRight: 1760,
        yTop: 977,
        yBottom: 1340
      },
      playerOrbit: {
        xLeft: 10,
        xRight: 873,
        yTop: 977,
        yBottom: 1340
      },
      neutral: {
        xLeft: 10,
        xRight: 1760,
        yTop: 397,
        yBottom: 953
      },
      opponentColony: {
        xLeft: 10,
        xRight: 873,
        yTop: 10,
        yBottom: 373
      },
      opponentOrbit: {
        xLeft: 897,
        xRight: 1760,
        yTop: 10,
        yBottom: 373
      }
    }
  };
}

export const layoutGameConfig = new LayoutGameConfig();
