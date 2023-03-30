import Cards from './cards';

export default class Player {
    name!: string;
    activeDeck = [];
    game = {};
    constructor(name) {
        this.name = name;
        this.activeDeck = [];
        this.game = {
            deck: null
        };
    }
}
