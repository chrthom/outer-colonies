class OCConstants {
  colonyID = 0;
  cardBackSideID = 1;
  magicLinkTTL = 24;
  /**
   * Placeholder id in the attack event for the attack-all action: instead of a single
   * ship and weapon uuid, the client sends this id twice to attack with all weapons.
   * Only valid against a single target at battle range 1.
   */
  attackAllID = '*';
}

export const constants = new OCConstants();
