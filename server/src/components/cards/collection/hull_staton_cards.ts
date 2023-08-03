import HullCard from '../types/hull_card';
import { HullMultipart } from '../types/hull_card';

export class Card119 extends HullCard {
  constructor() {
    super(119, 'Orbitaler Außenposten', 3, HullMultipart.noMultipart, {
      hp: 11,
      speed: 0,
      energy: 0,
      theta: 1,
      xi: 2,
      phi: 0,
      omega: 2,
      delta: 0,
      psi: 0
    });
  }
}

export class Card152 extends HullCard {
  constructor() {
    super(152, 'Orbitaler Außenposten', 2, HullMultipart.noMultipart, {
      hp: 10,
      speed: 0,
      energy: 0,
      theta: 1,
      xi: 0,
      phi: 1,
      omega: 2,
      delta: 0,
      psi: 1
    });
  }
}

export class Card153 extends HullCard {
  constructor() {
    super(153, 'Orbitaler Außenposten', 2, HullMultipart.noMultipart, {
      hp: 10,
      speed: 0,
      energy: 0,
      theta: 1,
      xi: 1,
      phi: 0,
      omega: 2,
      delta: 0,
      psi: 1
    });
  }
}

export class Card228 extends HullCard {
  constructor() {
    super(228, 'Orbitaler Außenposten', 2, HullMultipart.noMultipart, {
      hp: 10,
      speed: 0,
      energy: 0,
      theta: 1,
      xi: 0,
      phi: 0,
      omega: 2,
      delta: 0,
      psi: 2
    });
  }
}

export class Card446 extends HullCard {
  constructor() {
    super(446, 'Orbitaler Außenposten', 1, HullMultipart.noMultipart, {
      hp: 9,
      speed: 0,
      energy: 0,
      theta: 2,
      xi: 0,
      phi: 0,
      omega: 2,
      delta: 0,
      psi: 1
    });
  }
}
