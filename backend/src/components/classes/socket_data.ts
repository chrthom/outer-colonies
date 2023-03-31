import Cards from './cards';

const defaultDeck = [
    Cards.card160,
    Cards.card160,
    Cards.card160,
    Cards.card160,
    Cards.card160,
    Cards.card348,
    Cards.card348,
    Cards.card348,
    Cards.card348,
    Cards.card348,
    Cards.card130,
    Cards.card130,
    Cards.card130,
    Cards.card130,
    Cards.card130,
    Cards.card166,
    Cards.card166,
    Cards.card166,
    Cards.card166,
    Cards.card166,
    Cards.card163,
    Cards.card163,
    Cards.card163,
    Cards.card163,
];

export default class SocketData {
    name!: string;
    activeDeck = [];
    game = {};
    constructor(name) {
        this.name = name;
        this.activeDeck = defaultDeck;
        this.game = {
            room: null,
            deck: null
        };
    }
}
