import HullCard from '../types/hull_card';
import { HullMultipart } from '../types/hull_card';

export class Card119 extends HullCard {
  constructor() {
    super(119, 'Orbitaler Außenposten', 3, HullMultipart.noMultipart, {
      hp: 11,
      theta: 1,
      xi: 2,
      omega: 2
    });
  }
}

export class Card152 extends HullCard {
  constructor() {
    super(152, 'Orbitaler Außenposten', 2, HullMultipart.noMultipart, {
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
    super(153, 'Orbitaler Außenposten', 2, HullMultipart.noMultipart, {
      hp: 10,
      theta: 1,
      xi: 1,
      omega: 2,
      psi: 1
    });
  }
}

export class Card228 extends HullCard {
  constructor() {
    super(228, 'Orbitaler Außenposten', 2, HullMultipart.noMultipart, {
      hp: 10,
      theta: 1,
      omega: 2,
      psi: 2
    });
  }
}

export class Card446 extends HullCard {
  constructor() {
    super(446, 'Orbitaler Außenposten', 1, HullMultipart.noMultipart, {
      hp: 9,
      theta: 2,
      omega: 2,
      psi: 1
    });
  }
}
