import HullCard, { HullMultipart } from '../types/hull_card';

function toMultipart(...neededPartIds: number[]): HullMultipart {
    return {
        partNo: 3,
        neededPartIds: neededPartIds
    };
}

const battleshipMultipart = toMultipart(306, 308, 309, 313, 314, 315);
const cruiserMultipart = toMultipart(116, 117, 120, 121, 122, 133, 134);

export class Card116 extends HullCard {
    constructor() {
        super(
            116,
            'Kreuzer (Kern)',
            3,
            cruiserMultipart,
            {
                hp: 7,
                speed: 0,
                energy: 0,
                theta: 1,
                xi: 1,
                phi: 0,
                omega: 1,
                delta: 0,
                psi: 0
            }
        )
    }
}

export class Card117 extends HullCard {
    constructor() {
        super(
            117,
            'Kreuzer (Kern)',
            3,
            cruiserMultipart,
            {
                hp: 7,
                speed: 0,
                energy: 0,
                theta: 0,
                xi: 0,
                phi: 2,
                omega: 1,
                delta: 0,
                psi: 0
            }
        )
    }
}

export class Card120 extends HullCard {
    constructor() {
        super(
            120,
            'Kreuzer (Bug)',
            3,
            cruiserMultipart,
            {
                hp: 9,
                speed: -1,
                energy: 0,
                theta: 1,
                xi: 0,
                phi: 1,
                omega: 1,
                delta: 0,
                psi: 0
            }
        )
    }
}

export class Card121 extends HullCard {
    constructor() {
        super(
            121,
            'Kreuzer (Kern)',
            3,
            cruiserMultipart,
            {
                hp: 7,
                speed: 0,
                energy: 0,
                theta: 0,
                xi: 2,
                phi: 0,
                omega: 1,
                delta: 0,
                psi: 0
            }
        )
    }
}

export class Card122 extends HullCard {
    constructor() {
        super(
            122,
            'Kreuzer (Heck)',
            3,
            cruiserMultipart,
            {
                hp: 6,
                speed: 3,
                energy: 0,
                theta: 0,
                xi: 1,
                phi: 0,
                omega: 1,
                delta: 1,
                psi: 0
            }
        )
    }
}

export class Card133 extends HullCard {
    constructor() {
        super(
            133,
            'Kreuzer (Bug)',
            2,
            cruiserMultipart,
            {
                hp: 7,
                speed: 0,
                energy: 0,
                theta: 1,
                xi: 0,
                phi: 1,
                omega: 1,
                delta: 0,
                psi: 0
            }
        )
    }
}

export class Card134 extends HullCard {
    constructor() {
        super(
            134,
            'Kreuzer (Heck)',
            2,
            cruiserMultipart,
            {
                hp: 7,
                speed: 2,
                energy: 0,
                theta: 0,
                xi: 1,
                phi: 0,
                omega: 2,
                delta: 1,
                psi: 0
            }
        )
    }
}

export class Card306 extends HullCard {
    constructor() {
        super(
            306,
            'Schlachtschiff (Bug)',
            4,
            battleshipMultipart,
            {
                hp: 11,
                speed: 0,
                energy: 0,
                theta: 0,
                xi: 1,
                phi: 0,
                omega: 1,
                delta: 0,
                psi: 0
            }
        )
    }
}

export class Card308 extends HullCard {
    constructor() {
        super(
            308,
            'Schlachtschiff (Kern)',
            4,
            battleshipMultipart,
            {
                hp: 7,
                speed: 0,
                energy: 0,
                theta: 2,
                xi: 2,
                phi: 0,
                omega: 1,
                delta: 0,
                psi: 0
            }
        )
    }
}

export class Card309 extends HullCard {
    constructor() {
        super(
            309,
            'Schlachtschiff (Heck)',
            4,
            battleshipMultipart,
            {
                hp: 7,
                speed: 2,
                energy: -2,
                theta: 0,
                xi: 1,
                phi: 0,
                omega: 2,
                delta: 0,
                psi: 0
            }
        )
    }
}

export class Card313 extends HullCard {
    constructor() {
        super(
            313,
            'Schlachtschiff (Bug)',
            3,
            battleshipMultipart,
            {
                hp: 8,
                speed: 0,
                energy: 0,
                theta: 0,
                xi: 2,
                phi: 0,
                omega: 2,
                delta: 0,
                psi: 0
            }
        )
    }
}

export class Card314 extends HullCard {
    constructor() {
        super(
            314,
            'Schlachtschiff (Kern)',
            3,
            battleshipMultipart,
            {
                hp: 8,
                speed: 0,
                energy: 0,
                theta: 0,
                xi: 3,
                phi: 0,
                omega: 1,
                delta: 0,
                psi: 0
            }
        )
    }
}

export class Card315 extends HullCard {
    constructor() {
        super(
            315,
            'Schlachtschiff (Heck)',
            3,
            battleshipMultipart,
            {
                hp: 8,
                speed: 1,
                energy: -1,
                theta: 0,
                xi: 1,
                phi: 0,
                omega: 3,
                delta: 0,
                psi: 0
            }
        )
    }
}
