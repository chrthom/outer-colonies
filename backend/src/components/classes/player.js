const cards = require('./cards');

class Player {
    constructor(name) {
        this.name = name;
        this.activeDeck = [];
        this.game = {
            deck: null
        };
    }
}

module.exports = Player;
