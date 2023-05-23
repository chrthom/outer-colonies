export default class Layout {
    colors = {
        primary: 0x337777,
        secondary: 0x773333
    }
    stackYDistance = 30;
    cards = {
        scale: 0.25,
        damageIndicator: {
            xOffset: 90,
            yOffsetPlayer: -240,
            yOffsetOpponent: -15,
            fontSize: 20
        }
    };
    deck = {
        x: 1930,
        y: 1070
    };
    discardPile = {
        x: 2200,
        y: 1070
    };
    maxCard = {
        x: 2110,
        y: 820,
        scale: 0.75
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
    continueButton = {
        x: 2370,
        y: 30,
        fontSize: 32
    }
}
