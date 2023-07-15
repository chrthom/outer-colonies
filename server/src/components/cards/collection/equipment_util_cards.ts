import Player from "../../game_state/player";
import CardStack from "../card_stack";
import EquipmentCard from "../types/equipment_card";

export class Card104 extends EquipmentCard {
  readonly repairDamage = 10;
  constructor() {
    super(
      104,
      "Reperaturnaniten",
      5,
      {
        energy: -1,
        hp: 0,
        speed: 0,
        pointDefense: 0,
        shield: 0,
        armour: 0,
        theta: 0,
        xi: 0,
        phi: 0,
        omega: 0,
        delta: -1,
        psi: 0,
      },
      false,
    );
  }
  onEndTurn(player: Player, source: CardStack) {
    source.getRootCardStack().damage -= Math.min(
      source.getRootCardStack().damage,
      this.repairDamage,
    );
  }
}

export class Card109 extends EquipmentCard {
  constructor() {
    super(
      109,
      "Plasmanachbrenner",
      4,
      {
        energy: -3,
        hp: 0,
        speed: 2,
        pointDefense: 0,
        shield: 0,
        armour: 0,
        theta: 0,
        xi: 0,
        phi: 0,
        omega: 0,
        delta: -1,
        psi: 0,
      },
      false,
    );
  }
}

export class Card161 extends EquipmentCard {
  constructor() {
    super(
      161,
      "Ionenschubdüsen",
      1,
      {
        energy: -1,
        hp: 0,
        speed: 1,
        pointDefense: 0,
        shield: 0,
        armour: 0,
        theta: 0,
        xi: 0,
        phi: 0,
        omega: 0,
        delta: -1,
        psi: 0,
      },
      false,
    );
  }
}

export class Card325 extends EquipmentCard {
  readonly repairDamage = 2;
  constructor() {
    super(
      325,
      "Selbstreparierender Torso",
      2,
      {
        energy: 0,
        hp: 0,
        speed: 0,
        pointDefense: 0,
        shield: 0,
        armour: 0,
        theta: 0,
        xi: 0,
        phi: 0,
        omega: 0,
        delta: -1,
        psi: 0,
      },
      false,
    );
  }
  onEndTurn(player: Player, source: CardStack) {
    source.getRootCardStack().damage -= Math.min(
      source.getRootCardStack().damage,
      this.repairDamage,
    );
  }
}

export class Card434 extends EquipmentCard {
  constructor() {
    super(
      434,
      "Leichtbauweise",
      2,
      {
        energy: 0,
        hp: -3,
        speed: 1,
        pointDefense: 0,
        shield: 0,
        armour: 0,
        theta: 0,
        xi: 0,
        phi: 0,
        omega: 0,
        delta: -1,
        psi: 0,
      },
      false,
    );
  }
}

export class Card449 extends EquipmentCard {
  constructor() {
    super(
      449,
      "Schwerer Rumpf",
      1,
      {
        energy: 0,
        hp: 5,
        speed: -1,
        pointDefense: 0,
        shield: 0,
        armour: 0,
        theta: 0,
        xi: 0,
        phi: 0,
        omega: 0,
        delta: -1,
        psi: 0,
      },
      false,
    );
  }
}
