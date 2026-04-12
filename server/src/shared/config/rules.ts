import { DAILY_DEFINITIONS } from './dailies';

class OCRules {
  readonly cardsToDrawPerTurn = 2;
  readonly colonyHP = 50;
  readonly controlLimit = 15;
  readonly initialCardsToDraw = 7;
  readonly maxHandCards = 7;
  readonly maxRange = 4;
  readonly countdownTimer = 90;

  // Explicit type definition for dailyEarnings to maintain backward compatibility
  readonly dailyEarnings: {
    login: number;
    victory: number;
    game: number;
    energy: number;
    ships: number;
    domination: number;
    destruction: number;
    control: number;
    juggernaut: number;
    stations: number;
    discard: number;
    colony: number;
    colossus: number;
  };

  readonly gameEarnings = {
    victory: 50,
    cardsInGame: 3,
    discardPile: 1,
    dealtColonyDamage: 1
  };
  readonly minCardsForVictoryBonus = 6;
  readonly boosterCosts = [Infinity, 920, 1045, 1045, 1045];

  constructor() {
    // Initialize dailyEarnings from centralized definitions
    this.dailyEarnings = DAILY_DEFINITIONS.reduce(
      (acc, daily) => {
        acc[daily.dbColumn as keyof typeof acc] = daily.solReward;
        return acc;
      },
      {} as {
        login: number;
        victory: number;
        game: number;
        energy: number;
        ships: number;
        domination: number;
        destruction: number;
        control: number;
        juggernaut: number;
        stations: number;
        discard: number;
        colony: number;
        colossus: number;
      }
    );
  }
}

export const rules = new OCRules();
