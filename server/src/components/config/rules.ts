class OCRules {
  readonly cardsToDrawPerTurn = 2;
  readonly cardsPerMission = 2;
  readonly colonyHP = 50;
  readonly initialCardsToDraw = 7;
  readonly maxHandCards = 7;
  readonly maxRange = 4;

  readonly solEarnings = {
    login: 75
  };
}

export const rules = new OCRules();
