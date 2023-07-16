class OCRules {
  readonly cardsToDrawPerTurn = 2;
  readonly cardsPerMission = 2;
  readonly colonyHP = 50;
  readonly initialCardsToDraw = 7;
  readonly maxHandCards = 7;
  readonly maxRange = 4;

  readonly dailyEarnings = {
    login: 35,
    victory: 45,
    game: 70,
    energy: 90,
    ships: 125
  };
}

export const rules = new OCRules();
