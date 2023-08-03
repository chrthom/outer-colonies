import HullCard, { HullMultipart } from '../types/hull_card';

function toMultipart(...neededPartIds: number[]): HullMultipart {
  return {
    partNo: 2,
    neededPartIds: neededPartIds
  };
}

const destroyerMultipart = toMultipart(177, 178, 444, 445);
const freighterMultipart = toMultipart(221, 226, 326, 327);
const frigateMultipart = toMultipart(131, 132, 213, 328, 329, 418);

export class Card131 extends HullCard {
  constructor() {
    super(131, 'Fregatte (Bug)', 2, frigateMultipart, {
      hp: 6,
      speed: 0,
      energy: 0,
      theta: 0,
      xi: 0,
      phi: 0,
      omega: 2,
      delta: 0,
      psi: 0
    });
  }
}

export class Card132 extends HullCard {
  constructor() {
    super(132, 'Fregatte (Heck)', 2, frigateMultipart, {
      hp: 6,
      speed: 3,
      energy: 0,
      theta: 0,
      xi: 0,
      phi: 2,
      omega: 0,
      delta: 1,
      psi: 0
    });
  }
}

export class Card177 extends HullCard {
  constructor() {
    super(177, 'Zerstörer (Bug)', 1, destroyerMultipart, {
      hp: 5,
      speed: 0,
      energy: 0,
      theta: 1,
      xi: 1,
      phi: 0,
      omega: 0,
      delta: 0,
      psi: 0
    });
  }
}

export class Card178 extends HullCard {
  constructor() {
    super(178, 'Zerstörer (Heck)', 1, destroyerMultipart, {
      hp: 5,
      speed: 3,
      energy: 0,
      theta: 0,
      xi: 0,
      phi: 1,
      omega: 1,
      delta: 1,
      psi: 0
    });
  }
}

export class Card213 extends HullCard {
  constructor() {
    super(213, 'Fregatte (Heck)', 3, frigateMultipart, {
      hp: 6,
      speed: 3,
      energy: 0,
      theta: 3,
      xi: 0,
      phi: 0,
      omega: 0,
      delta: 1,
      psi: 0
    });
  }
}

export class Card221 extends HullCard {
  constructor() {
    super(221, 'Schwerer Frachter (Bug)', 2, freighterMultipart, {
      hp: 6,
      speed: 0,
      energy: 0,
      theta: 1,
      xi: 0,
      phi: 0,
      omega: 1,
      delta: 0,
      psi: 1
    });
  }
}

export class Card226 extends HullCard {
  constructor() {
    super(226, 'Schwerer Frachter (Heck)', 2, freighterMultipart, {
      hp: 5,
      speed: 3,
      energy: 0,
      theta: 0,
      xi: 0,
      phi: 0,
      omega: 1,
      delta: 0,
      psi: 1
    });
  }
}

export class Card326 extends HullCard {
  constructor() {
    super(326, 'Schwerer Frachter (Bug)', 2, freighterMultipart, {
      hp: 8,
      speed: -1,
      energy: 0,
      theta: 1,
      xi: 0,
      phi: 0,
      omega: 1,
      delta: 0,
      psi: 1
    });
  }
}

export class Card327 extends HullCard {
  constructor() {
    super(327, 'Schwerer Frachter (Heck)', 2, freighterMultipart, {
      hp: 6,
      speed: 2,
      energy: 0,
      theta: 0,
      xi: 0,
      phi: 0,
      omega: 1,
      delta: 1,
      psi: 1
    });
  }
}

export class Card328 extends HullCard {
  constructor() {
    super(328, 'Fregatte (Bug)', 2, frigateMultipart, {
      hp: 8,
      speed: -1,
      energy: 0,
      theta: 0,
      xi: 0,
      phi: 0,
      omega: 2,
      delta: 0,
      psi: 0
    });
  }
}

export class Card329 extends HullCard {
  constructor() {
    super(329, 'Fregatte (Heck)', 2, frigateMultipart, {
      hp: 6,
      speed: 2,
      energy: 0,
      theta: 0,
      xi: 2,
      phi: 0,
      omega: 1,
      delta: 1,
      psi: 0
    });
  }
}

export class Card418 extends HullCard {
  constructor() {
    super(418, 'Fregatte (Bug)', 3, frigateMultipart, {
      hp: 5,
      speed: 0,
      energy: 0,
      theta: 0,
      xi: 0,
      phi: 0,
      omega: 3,
      delta: 0,
      psi: 0
    });
  }
}

export class Card444 extends HullCard {
  constructor() {
    super(444, 'Zerstörer (Bug)', 1, destroyerMultipart, {
      hp: 5,
      speed: 0,
      energy: 0,
      theta: 1,
      xi: 0,
      phi: 1,
      omega: 0,
      delta: 0,
      psi: 0
    });
  }
}

export class Card445 extends HullCard {
  constructor() {
    super(445, 'Zerstörer (Heck)', 1, destroyerMultipart, {
      hp: 5,
      speed: 3,
      energy: 0,
      theta: 0,
      xi: 1,
      phi: 0,
      omega: 1,
      delta: 1,
      psi: 0
    });
  }
}
