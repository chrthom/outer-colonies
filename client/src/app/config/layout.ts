class LayoutConfig {
  readonly colors = {
    alpha: 0.8,
    fadedAlpha: 0.3,
    fadedTint: 0x666666,
    neutral: 0xffffff,
    primary: 0x119999,
    secondary: 0x991111
  };
  readonly stackYDistance = 30;

  readonly font = {
    captionFamily: 'latin-modern-mono-caps',
    textFamily: 'latin-modern-sans',
    color: '#ffffff',
    colorHover: '#eeeeaa',
    colorWarn: '#991111',
    size: 28
  };

  readonly depth = {
    background: -1000,
    indicators: 20,
    discardCard: 50,
    handCard: 70,
    battleEffects: 85,
    maxedTacticCard: 100
  };

  readonly actionPool = {
    x: 2370,
    y: 1040,
    yDistance: -55
  };
  readonly attack = {
    fontSize: 36,
    color: {
      pointDefense: '#999911',
      shield: '#119999',
      armour: '#999999',
      damage: '#991111'
    }
  };
  readonly cards = {
    scale: {
      min: 0.1,
      normal: 0.25,
      max: 1
    },
    damageIndicator: {
      xOffsetPlayer: -75,
      yOffsetPlayer: -265,
      xOffsetOpponent: -75,
      yOffsetOpponent: 265,
      fontSize: 20
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
  readonly combatRange = {
    x: 1760,
    y: 730
  };
  readonly continueButton = {
    x: 2370,
    y: 60,
    xTextOffset: -120,
    fontSize: 36
  };
  readonly countdownIndicator = {
    x: 2350,
    y: 600,
    fontSize: 30
  };
  readonly deck = {
    x: 1930,
    y: 1070
  };
  readonly discardPile = {
    x: 2190,
    y: 1070,
    yOpponent: -400
  };
  readonly exitButton = {
    x: 2350,
    y: 450,
    xTextOffset: -30,
    yTextOffset: -4,
    yConfirmOffset: 35,
    fontSize: 30
  };
  readonly loadingAnimation = {
    x: 1200,
    y: 750,
    radius: 64,
    barWidth: 10,
    textOffsetY: -120
  };
  readonly maxCard = {
    x: 2110,
    y: 820,
    scale: 0.75
  };
  readonly maxedTacticCard = {
    x: 1200,
    y: 900,
    yOpponent: 300,
    scale: 0.8
  };
  readonly missionCards = {
    x: 1760,
    y: 650,
    xDistance: 20,
    yDistance: 10
  };
  readonly opponent = {
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
      maxWidth: 650
    }
  };
  readonly player = {
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
  readonly preloader = {
    x: 1200,
    y: 700,
    width: 500,
    height: 50,
    boxPadding: 10,
    textOffsetY: -50
  };
  readonly prompt = {
    box: {
      x: 1850,
      y: 120
    },
    x: 1875,
    y: 165,
    fontSize: 22,
    fontSizeBig: 30
  };
  readonly scene = {
    height: 1350,
    width: 2400
  };
  readonly version = {
    x: 2360,
    y: 1340
  };
}

export const layoutConfig = new LayoutConfig();
