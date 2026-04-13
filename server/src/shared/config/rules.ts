class OCRules {
  readonly cardsToDrawPerTurn = 2;
  readonly colonyHP = 50;
  readonly controlLimit = 15;
  readonly initialCardsToDraw = 7;
  readonly maxHandCards = 7;
  readonly maxRange = 4;
  readonly countdownTimer = 90;

  readonly gameEarnings = {
    victory: 50,
    cardsInGame: 3,
    discardPile: 1,
    dealtColonyDamage: 1
  };
  readonly minCardsForVictoryBonus = 6;
  readonly boosterCosts = [Infinity, 920, 1045, 1045, 1045];
}

export const rules = new OCRules();
