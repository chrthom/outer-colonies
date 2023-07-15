import HullCard from "../types/hull_card";
import { HullMultipart } from "../types/hull_card";

abstract class CardCorvette extends HullCard {
  constructor(id: number) {
    super(id, "Korvette", 0, HullMultipart.noMultipart, {
      hp: 5,
      speed: 4,
      energy: 0,
      theta: 2,
      xi: 0,
      phi: 0,
      omega: 1,
      delta: 1,
      psi: 0,
    });
  }
}

export class Card160 extends HullCard {
  constructor() {
    super(160, "Leichter Frachter", 1, HullMultipart.noMultipart, {
      hp: 5,
      speed: 4,
      energy: 0,
      theta: 1,
      xi: 0,
      phi: 0,
      omega: 1,
      delta: 1,
      psi: 1,
    });
  }
}

export class Card186 extends CardCorvette {
  constructor() {
    super(186);
  }
}

export class Card220 extends HullCard {
  constructor() {
    super(220, "Blockadebrecher", 2, HullMultipart.noMultipart, {
      hp: 4,
      speed: 5,
      energy: 0,
      theta: 1,
      xi: 0,
      phi: 0,
      omega: 1,
      delta: 0,
      psi: 0,
    });
  }
}

export class Card243 extends CardCorvette {
  constructor() {
    super(243);
  }
}

export class Card342 extends HullCard {
  constructor() {
    super(342, "Torpedoboot", 1, HullMultipart.noMultipart, {
      hp: 4,
      speed: 4,
      energy: 0,
      theta: 0,
      xi: 0,
      phi: 1,
      omega: 1,
      delta: 1,
      psi: 0,
    });
  }
}

export class Card348 extends HullCard {
  constructor() {
    super(348, "Kanonenboot", 1, HullMultipart.noMultipart, {
      hp: 5,
      speed: 3,
      energy: 0,
      theta: 0,
      xi: 1,
      phi: 0,
      omega: 1,
      delta: 0,
      psi: 0,
    });
  }
}

export class Card351 extends CardCorvette {
  constructor() {
    super(351);
  }
}

export class Card436 extends HullCard {
  constructor() {
    super(436, "Panzerschiff", 2, HullMultipart.noMultipart, {
      hp: 7,
      speed: 2,
      energy: 0,
      theta: 0,
      xi: 1,
      phi: 0,
      omega: 2,
      delta: 0,
      psi: 0,
    });
  }
}

export class Card439 extends HullCard {
  constructor() {
    super(439, "Mittelschwerer Frachter", 1, HullMultipart.noMultipart, {
      hp: 6,
      speed: 3,
      energy: 0,
      theta: 1,
      xi: 0,
      phi: 0,
      omega: 2,
      delta: 1,
      psi: 1,
    });
  }
}

export class Card450 extends CardCorvette {
  constructor() {
    super(450);
  }
}
