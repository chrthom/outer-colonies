const { HullCard, HullMultipart, HullProfile } = require('./card');

const noMultiPart = new HullMultipart(1, 1);

class Card160 extends HullCard {
    constructor() {
        super(160, 'Leichter Frachter', noMultiPart, new HullProfile(5, 4, 0, 1, 0, 0 , 1, 1, 1))
    }
}

class Card348 extends HullCard {
    constructor() {
        super(348, 'Kanonenboot', noMultiPart, new HullProfile(5, 3, 0, 0, 1, 0 , 1, 0, 0))
    }
}

module.exports = {
    Card160,
    Card348
};
