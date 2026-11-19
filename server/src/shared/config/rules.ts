class OCRules {
  readonly cardsToDrawPerTurn = 2;
  readonly colonyHP = 50;
  readonly controlLimit = 15;
  readonly initialCardsToDraw = 7;
  readonly maxHandCards = 7;
  readonly maxRange = 4;
  readonly countdownTimer = 90;
  /** Seconds a disconnected player has to reconnect to a running match before it surrenders them */
  readonly reconnectGracePeriod = 60;
  /** Seconds a finished match stays registered to deliver its result to players who were offline when it ended */
  readonly resultDeliveryPeriod = 24 * 60 * 60;

  readonly gameEarnings = {
    victory: 50,
    cardsInGame: 3,
    discardPile: 1,
    dealtColonyDamage: 1
  };
  readonly minCardsForVictoryBonus = 6;
  readonly boosterCosts = [Infinity, 920, 1045, 1045, 1045, 1105];
}

export const rules = new OCRules();
