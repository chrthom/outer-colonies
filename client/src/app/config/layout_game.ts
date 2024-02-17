class LayoutGameConfig {
  readonly perspective = {
    z: {
      near: -4,
      board: -10,
      far: -25,
      stackStep: 0.01,
      zoneStep: 0.2
    },
    origin: {
      x: 1200,
      y: 675
    },
    factor: {
      x: 0.0048,
      y: -0.0039
    }
  };
  private withCardXFactor(x: number) {
    return x * this.perspective.factor.x;
  }
  private withCardYFactor(y: number) {
    return y * this.perspective.factor.y;
  }
  private toCardX(x: number): number {
    return this.withCardXFactor(x - this.perspective.origin.x);
  }
  private toCardY(y: number): number {
    return this.withCardYFactor(y - this.perspective.origin.y);
  }
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
    perspective: {
      none: Phaser.Math.DegToRad(0),
      neutral: Phaser.Math.DegToRad(-10),
      board: Phaser.Math.DegToRad(-30)
    },
    placement: {
      zoneWidth: this.withCardXFactor(1530),
      halfZoneWidth: this.withCardXFactor(650),
      hand: {
        angleStep: -5,
        startAngle: 10,
        xStep: this.withCardXFactor(-50),
        yStep: this.withCardYFactor(5)
      },
      player: {
        colony: {
          x: this.toCardX(120),
          y: this.toCardY(1220)
        },
        deck: {
          x: this.toCardX(1930),
          y: this.toCardY(930)
        },
        discardPile: {
          x: this.toCardX(2190),
          y: this.toCardY(930)
        },
        hand: {
          x: this.toCardX(2370),
          y: this.toCardY(1220)
        },
        orbit: {
          x: this.toCardX(120),
          y: this.toCardY(934)
        },
        neutral: {
          x: this.toCardX(1000),
          y: this.toCardY(658)
        }
      },
      opponent: {
        colony: {
          x: this.toCardX(120),
          y: this.toCardY(130)
        },
        deck: {
          x: this.toCardX(1930),
          y: this.toCardY(345)
        },
        discardPile: {
          x: this.toCardX(2190),
          y: this.toCardY(345)
        },
        hand: {
          x: this.toCardX(2370),
          y: this.toCardY(65)
        },
        orbit: {
          x: this.toCardX(120),
          y: this.toCardY(416)
        },
        neutral: {
          x: this.toCardX(120),
          y: this.toCardY(692)
        }
      }
    },
    retractCardButton: {
      xOffset: -45,
      yOffset: -252
    },
    stackYDistance: this.withCardYFactor(38)
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
