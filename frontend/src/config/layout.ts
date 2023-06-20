class Layout {
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
        family: 'Impact',
        color: '#eeeeaa'
    };

    readonly depth = {
        discardCard: 5,
        maxedTacticCard: 10
    };

    readonly actionPool = {
        x: 2370,
        y: 1040,
        yDistance: -55
    };
    readonly attack = {
        fontSize: 30,
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
            xOffset: 90,
            yOffsetPlayer: -240,
            yOffsetOpponent: -15,
            fontSize: 20
        },
        defenseIndicator: {
            xOffset: 90,
            yOffsetPlayer: -190,
            yOffsetOpponent: 35,
            yDistance: 50
        },
        retractCardButton: {
            xOffset: -80,
            yOffset: -245
        }
    };
    readonly maxedTacticCard = {
        x: 1200,
        y: 900,
        yOpponent: 300,
        scale: 0.8
    }
    readonly continueButton = {
        x: 2370,
        y: 30,
        fontSize: 32
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
    readonly maxCard = {
        x: 2110,
        y: 820,
        scale: 0.75
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
    }
    readonly prompt = {
        x: 2370,
        y: 80,
        fontSize: 24
    };
}

export const layout = new Layout();
