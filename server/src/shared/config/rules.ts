class OCRules {
  readonly cardsToDrawPerTurn = 2;
  readonly cardsPerMission = 2;
  readonly colonyHP = 50;
  readonly initialCardsToDraw = 7;
  readonly maxHandCards = 7;
  readonly maxRange = 4;
  readonly countdownTimer = 180;

  readonly dailyEarnings = {
    login: 35,
    victory: 45,
    game: 70,
    energy: 90,
    ships: 125
  };
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
