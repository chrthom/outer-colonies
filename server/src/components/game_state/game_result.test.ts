import GameResult from './game_result';
import { CardType, DailyType, GameResultType } from '../../shared/config/enums';

function makeMatch() {
  const colonyCardStack = { damage: 0, profile: { energy: 0 }, cards: [] };
  return {
    players: [
      {
        no: 0,
        name: 'Player1',
        colonyCardStack,
        deck: [],
        discardPile: [],
        cardStacks: []
      },
      {
        no: 1,
        name: 'Player2',
        colonyCardStack,
        deck: [],
        discardPile: [],
        cardStacks: []
      }
    ]
  };
}

function makeResult(match: any = makeMatch()) {
  const result = new GameResult(match as any);
  // Prevent the I/O method from issuing real DB calls during setter tests.
  // No `as any` cast: `persistEarnings` is part of the public surface now.
  jest.spyOn(result, 'persistEarnings').mockResolvedValue(undefined);
  return { result, match };
}

describe('GameResult', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('victory setters', () => {
    test.each([
      ['setWinnerByDomination', GameResultType.Domination],
      ['setWinnerByDeckDepletion', GameResultType.Depletion],
      ['setWinnerByDestruction', GameResultType.Destruction],
      ['setWinnerBySurrender', GameResultType.Surrender]
    ] as const)('%s marks the opponent as winner and stores the result type', (method, expectedType) => {
      const { result, match } = makeResult();

      (result as any)[method](match.players[1]);

      expect(result.gameOver).toBe(true);
      expect(result.winnerNo).toBe(0);
      expect(result.type).toBe(expectedType);
    });

    test('winner flips when the other player loses', () => {
      const { result, match } = makeResult();

      result.setWinnerByDeckDepletion(match.players[0]);

      expect(result.winnerNo).toBe(1);
      expect(result.type).toBe(GameResultType.Depletion);
    });
  });

  describe('shouldAchieveDaily', () => {
    const player = (over: any = {}) => ({
      colonyCardStack: { profile: { energy: 0 }, cards: [], damage: 0 },
      cardStacks: [],
      discardPile: [],
      ...over
    });
    const stack = (over: any = {}) => ({
      isFlightReady: true,
      profile: { hp: 0, control: 0, speed: 1 },
      cards: [],
      ...over
    });

    function check(dailyType: DailyType, p: any, opp: any, won: boolean, type?: GameResultType) {
      const { result } = makeResult();
      if (type) result.type = type;
      return (result as any).shouldAchieveDaily(dailyType, p, opp, won);
    }

    test('Victory is achieved when the player won', () => {
      expect(check(DailyType.Victory, player(), player(), true)).toBe(true);
      expect(check(DailyType.Victory, player(), player(), false)).toBe(false);
    });

    test('Game is achieved unless the result is Surrender', () => {
      expect(check(DailyType.Game, player(), player(), true, GameResultType.Destruction)).toBe(true);
      expect(check(DailyType.Game, player(), player(), true, GameResultType.Surrender)).toBe(false);
    });

    test('Energy requires the colony card to have at least 6 energy', () => {
      const high = player({ colonyCardStack: { profile: { energy: 6 }, cards: [], damage: 0 } });
      const low = player({ colonyCardStack: { profile: { energy: 5 }, cards: [], damage: 0 } });

      expect(check(DailyType.Energy, high, player(), true)).toBe(true);
      expect(check(DailyType.Energy, low, player(), true)).toBe(false);
    });

    test('Ships requires at least 5 flight-ready stacks', () => {
      const ready = player({
        cardStacks: [stack(), stack(), stack(), stack(), stack(), stack({ isFlightReady: false })]
      });
      const notEnough = player({
        cardStacks: [stack(), stack(), stack(), stack()]
      });

      expect(check(DailyType.Ships, ready, player(), true)).toBe(true);
      expect(check(DailyType.Ships, notEnough, player(), true)).toBe(false);
    });

    test('Domination requires both winning and a Domination result', () => {
      expect(check(DailyType.Domination, player(), player(), true, GameResultType.Domination)).toBe(true);
      expect(check(DailyType.Domination, player(), player(), false, GameResultType.Domination)).toBe(false);
      expect(check(DailyType.Domination, player(), player(), true, GameResultType.Destruction)).toBe(false);
    });

    test('Destruction requires both winning and a Destruction result', () => {
      expect(check(DailyType.Destruction, player(), player(), true, GameResultType.Destruction)).toBe(true);
      expect(check(DailyType.Destruction, player(), player(), false, GameResultType.Destruction)).toBe(false);
      expect(check(DailyType.Destruction, player(), player(), true, GameResultType.Domination)).toBe(false);
    });

    test('Control requires summed control of flight-ready stacks to reach 10', () => {
      const ten = player({
        cardStacks: [
          stack({ profile: { hp: 0, control: 6, speed: 1 } }),
          stack({ profile: { hp: 0, control: 4, speed: 1 } }),
          stack({ isFlightReady: false, profile: { hp: 0, control: 10, speed: 1 } })
        ]
      });
      const nine = player({
        cardStacks: [stack({ profile: { hp: 0, control: 9, speed: 1 } })]
      });

      expect(check(DailyType.Control, ten, player(), true)).toBe(true);
      expect(check(DailyType.Control, nine, player(), true)).toBe(false);
    });

    test('Juggernaut requires a flight-ready stack with at least 20 hp', () => {
      const big = player({
        cardStacks: [stack({ profile: { hp: 20, control: 0, speed: 1 } })]
      });
      const notReady = player({
        cardStacks: [stack({ isFlightReady: false, profile: { hp: 25, control: 0, speed: 1 } })]
      });
      const small = player({
        cardStacks: [stack({ profile: { hp: 19, control: 0, speed: 1 } })]
      });

      expect(check(DailyType.Juggernaut, big, player(), true)).toBe(true);
      expect(check(DailyType.Juggernaut, notReady, player(), true)).toBe(false);
      expect(check(DailyType.Juggernaut, small, player(), true)).toBe(false);
    });

    test('Stations requires at least 3 hull cards across speed-0 flight-ready stacks', () => {
      const station = stack({
        profile: { hp: 0, control: 0, speed: 0 },
        cards: [{ type: CardType.Hull }, { type: CardType.Hull }]
      });
      const ship = stack({
        profile: { hp: 0, control: 0, speed: 1 },
        cards: [{ type: CardType.Hull }, { type: CardType.Hull }, { type: CardType.Hull }]
      });

      const enough = player({
        cardStacks: [
          stack({
            profile: { hp: 0, control: 0, speed: 0 },
            cards: [
              { type: CardType.Hull },
              { type: CardType.Hull },
              { type: CardType.Hull },
              { type: CardType.Equipment }
            ]
          })
        ]
      });
      const onlyMovingShips = player({ cardStacks: [ship] });
      const stationButNoHulls = player({ cardStacks: [station] });

      expect(check(DailyType.Stations, enough, player(), true)).toBe(true);
      expect(check(DailyType.Stations, onlyMovingShips, player(), true)).toBe(false);
      expect(check(DailyType.Stations, stationButNoHulls, player(), true)).toBe(false);
    });

    test('Discard requires the discard pile to reach 50 cards', () => {
      const big = player({ discardPile: new Array(50).fill({}) });
      const small = player({ discardPile: new Array(49).fill({}) });

      expect(check(DailyType.Discard, big, player(), true)).toBe(true);
      expect(check(DailyType.Discard, small, player(), true)).toBe(false);
    });

    test('Colony requires more than 7 cards on the colony stack', () => {
      const big = player({
        colonyCardStack: { profile: { energy: 0 }, cards: new Array(8).fill({}), damage: 0 }
      });
      const exactly7 = player({
        colonyCardStack: { profile: { energy: 0 }, cards: new Array(7).fill({}), damage: 0 }
      });

      expect(check(DailyType.Colony, big, player(), true)).toBe(true);
      expect(check(DailyType.Colony, exactly7, player(), true)).toBe(false);
    });

    test('Colossus requires a flight-ready stack with at least 7 cards', () => {
      const colossus = player({
        cardStacks: [stack({ cards: new Array(7).fill({}) })]
      });
      const notReady = player({
        cardStacks: [stack({ isFlightReady: false, cards: new Array(10).fill({}) })]
      });
      const small = player({
        cardStacks: [stack({ cards: new Array(6).fill({}) })]
      });

      expect(check(DailyType.Colossus, colossus, player(), true)).toBe(true);
      expect(check(DailyType.Colossus, notReady, player(), true)).toBe(false);
      expect(check(DailyType.Colossus, small, player(), true)).toBe(false);
    });

    test('Login is never achieved through shouldAchieveDaily', () => {
      expect(check(DailyType.Login, player(), player(), true)).toBe(false);
    });
  });

  describe('computeEarnings (pure)', () => {
    const makePlayer = (over: any = {}) => ({
      colonyCardStack: { damage: 0, profile: { energy: 0 }, cards: [] },
      cardStacks: [],
      discardPile: [],
      ...over
    });

    test('pays for discard pile, in-game cards and opponent colony damage', () => {
      // No DB-stubbing spy here — proves computeEarnings is side-effect-free.
      const result = new GameResult(makeMatch() as any);
      const player = makePlayer({
        discardPile: new Array(4).fill({}), // 4 * 1 = 4
        cardStacks: [
          // ingameCards = total cards across stacks - 1 (the colony card itself)
          // 3 stacks * 2 cards = 6, then -1 => 5 * 3 = 15
          { cards: [{}, {}] },
          { cards: [{}, {}] },
          { cards: [{}, {}] }
        ]
      });
      const opponent = makePlayer({
        colonyCardStack: { damage: 7, profile: { energy: 0 }, cards: [] } // 7 * 1 = 7
      });

      // Non-surrender loss: no victory bonus, so 4 + 7 + 15 = 26.
      result.type = GameResultType.Destruction;
      expect(result.computeEarnings(player, opponent, false)).toBe(26);
    });

    test('adds the victory bonus when the player won a non-surrender game', () => {
      const result = new GameResult(makeMatch() as any);
      result.type = GameResultType.Destruction;
      const player = makePlayer();
      const opponent = makePlayer();

      // discard 0, dmg 0, ingameCards = -1 -> sol = -3 + 50 (bonus) = 47.
      // Math.max(0, ...) keeps it at 47.
      expect(result.computeEarnings(player, opponent, true)).toBe(47);
    });

    test('withholds the victory bonus on surrender below minCardsForVictoryBonus', () => {
      const result = new GameResult(makeMatch() as any);
      result.type = GameResultType.Surrender;
      // 2 discard cards + 0 ingame cards (after -1) -> 2 - 3 = -1 -> floored to 0.
      const player = makePlayer({ discardPile: new Array(2).fill({}) });
      const opponent = makePlayer();

      expect(result.computeEarnings(player, opponent, true)).toBe(0);
    });

    test('grants the victory bonus on surrender once minCardsForVictoryBonus is reached', () => {
      const result = new GameResult(makeMatch() as any);
      result.type = GameResultType.Surrender;
      // 7 discard cards + -1 ingameCards = 6, meets the threshold of 6.
      // sol = 7 (discard) + -3 (ingameCards * 3) + 50 (bonus) = 54.
      const player = makePlayer({ discardPile: new Array(7).fill({}) });
      const opponent = makePlayer();

      expect(result.computeEarnings(player, opponent, true)).toBe(54);
    });

    test('floors negative computations at 0', () => {
      const result = new GameResult(makeMatch() as any);
      result.type = GameResultType.Destruction;
      // No discard, no opponent damage, no stacks -> ingameCards = -1 -> sol = -3.
      const player = makePlayer();
      const opponent = makePlayer();

      expect(result.computeEarnings(player, opponent, false)).toBe(0);
    });
  });
});
