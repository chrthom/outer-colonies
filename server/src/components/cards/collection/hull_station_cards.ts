import HullCard, { toHullMultipart } from '../types/hull_card';

const spaceStation = toHullMultipart(2, true, 111, 158, 227);
const starFortress = toHullMultipart(3, true, 102, 113, 128, 311);
const orbitalOutpost = toHullMultipart(1, true);

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
    super(119, 'Orbitaler Außenposten', 3, orbitalOutpost, {
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
    super(152, 'Orbitaler Außenposten', 2, orbitalOutpost, {
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
    super(153, 'Orbitaler Außenposten', 2, orbitalOutpost, {
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
    super(228, 'Orbitaler Außenposten', 2, orbitalOutpost, {
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
    super(446, 'Orbitaler Außenposten', 1, orbitalOutpost, {
      hp: 9,
      theta: 2,
      omega: 2,
      psi: 1
    });
  }
}

export const allCards = [
  new Card102(),
  new Card111(),
  new Card113(),
  new Card119(),
  new Card128(),
  new Card152(),
  new Card153(),
  new Card158(),
  new Card227(),
  new Card228(),
  new Card311(),
  new Card446()
];
