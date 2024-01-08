import HullCard from '../types/hull_card';
import { HullMultipart } from '../types/hull_card';

function toMultipart(numberOfRequiredParts: number, ...neededpartIds: number[]): HullMultipart {
  return {
    numberOfRequiredParts: numberOfRequiredParts,
    neededPartIds: neededpartIds,
    duplicatesAllowed: true
  };
}

const spaceStation = toMultipart(2, 111, 158, 227);
const starFortress = toMultipart(3, 102, 113, 128, 311);

export class Card102 extends HullCard {
  constructor() {
    super(102, 'Sternbasis', 5, starFortress, {
      hp: 17,
      theta: 1,
      xi: 2,
      phi: 1,
      omega: 3
    });
  }
}

export class Card111 extends HullCard {
  constructor() {
    super(111, 'Raumstation', 4, spaceStation, {
      hp: 14,
      theta: 1,
      xi: 2,
      omega: 2
    });
  }
}

export class Card113 extends HullCard {
  constructor() {
    super(113, 'Sternbasis', 4, starFortress, {
      hp: 15,
      xi: 3,
      omega: 2,
      psi: 1
    });
  }
}

export class Card119 extends HullCard {
  constructor() {
    super(119, 'Orbitaler Außenposten', 3, toMultipart(1), {
      hp: 11,
      theta: 1,
      xi: 2,
      omega: 2
    });
  }
}

export class Card128 extends HullCard {
  constructor() {
    super(128, 'Sternbasis', 3, starFortress, {
      hp: 14,
      theta: 1,
      omega: 3,
      psi: 2
    });
  }
}

export class Card152 extends HullCard {
  constructor() {
    super(152, 'Orbitaler Außenposten', 2, toMultipart(1), {
      hp: 10,
      theta: 1,
      phi: 1,
      omega: 2,
      psi: 1
    });
  }
}

export class Card153 extends HullCard {
  constructor() {
    super(153, 'Orbitaler Außenposten', 2, toMultipart(1), {
      hp: 10,
      theta: 1,
      xi: 1,
      omega: 2,
      psi: 1
    });
  }
}

export class Card158 extends HullCard {
  constructor() {
    super(158, 'Raumstation', 2, spaceStation, {
      hp: 12,
      theta: 1,
      phi: 1,
      omega: 2,
      psi: 1
    });
  }
}

export class Card227 extends HullCard {
  constructor() {
    super(227, 'Raumstation', 2, spaceStation, {
      hp: 12,
      theta: 3,
      omega: 2,
      psi: 1
    });
  }
}

export class Card228 extends HullCard {
  constructor() {
    super(228, 'Orbitaler Außenposten', 2, toMultipart(1), {
      hp: 10,
      theta: 1,
      omega: 2,
      psi: 2
    });
  }
}

export class Card311 extends HullCard {
  constructor() {
    super(311, 'Sternbasis', 3, starFortress, {
      hp: 14,
      xi: 1,
      phi: 1,
      omega: 2,
      psi: 1
    });
  }
}

export class Card446 extends HullCard {
  constructor() {
    super(446, 'Orbitaler Außenposten', 1, toMultipart(1), {
      hp: 9,
      theta: 2,
      omega: 2,
      psi: 1
    });
  }
}
