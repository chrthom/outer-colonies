import CardStack from '../cards/card_stack';
import Match from './match';
import { InterventionAttack, InterventionBattleRoundEnd, InterventionTacticCard } from './intervention';

const createMatch = (): Match => ({ intervention: undefined }) as unknown as Match;
const createTacticCard = (match: Match): InterventionTacticCard =>
  new InterventionTacticCard(match, {} as CardStack, {} as CardStack);

describe('Intervention', () => {
  describe('root', () => {
    test('should be the intervention itself when it is not nested', () => {
      const match = createMatch();
      const intervention = new InterventionAttack(match, {} as CardStack, {} as CardStack);

      expect(intervention.root).toBe(intervention);
    });

    test('should be the parent intervention of a nested tactic card', () => {
      const match = createMatch();
      const roundEnd = new InterventionBattleRoundEnd(match);
      match.intervention = roundEnd;
      const tacticCard = createTacticCard(match);

      expect(tacticCard.root).toBe(roundEnd);
    });

    test('should be the root of a chain of nested tactic cards', () => {
      const match = createMatch();
      const roundEnd = new InterventionBattleRoundEnd(match);
      match.intervention = roundEnd;
      const tacticCard = createTacticCard(match);
      match.intervention = tacticCard;
      const counterTacticCard = createTacticCard(match);

      expect(counterTacticCard.root).toBe(roundEnd);
    });

    test('should be a tactic card itself when played without a parent intervention', () => {
      const match = createMatch();
      const tacticCard = createTacticCard(match);

      expect(tacticCard.root).toBe(tacticCard);
    });
  });
});
