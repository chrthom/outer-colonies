export default class Layout {
    colors = {
        alpha: 0.8,
        neutral: 0xffffff,
        primary: 0x119999,
        secondary: 0x991111
    };
    stackYDistance = 30;

    actionPool = {
        x: 2370,
        y: 1040,
        yDistance: -55
    }
    cards = {
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
    continueButton = {
        x: 2370,
        y: 30,
        fontSize: 32
    };
    deck = {
        x: 1930,
        y: 1070
    };
    discardPile = {
        x: 2190,
        y: 1070
    };
    maxCard = {
        x: 2110,
        y: 820,
        scale: 0.75
    };
    missionCards = {
        x: 1700,
        y: 650,
        xDistance: 20,
        yDistance: 10
    };
    player = {
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
            maxWidth: 650
        },
        orbital: {
            x: 120,
            y: 1250,
            maxWidth: 650
        },
        neutral: {
            x: 1000,
            y: 670,
            maxWidth: 650
        }
    };
    opponent = {
        colony: {
            x: 120,
            y: 100,
            maxWidth: 650
        },
        orbital: {
            x: 1000,
            y: 100,
            maxWidth: 650
        },
        neutral: {
            x: 120,
            y: 670,
            maxWidth: 650
        }
    };
    prompt = {
        x: 2370,
        y: 80,
        fontSize: 24
    };
}
