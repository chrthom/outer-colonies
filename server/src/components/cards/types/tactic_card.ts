import { CardType, TacticDiscipline } from '../../config/enums';
import Card from '../card';
import CardProfile from '../card_profile';
import CardStack from '../card_stack';

export default abstract class TacticCard extends Card {
  constructor(id: number, name: string, rarity: number) {
    super(id, name, CardType.Tactic, rarity);
  }
  onRetraction() {}
  onStartTurn() {}
  onEndTurn() {}
  override canBeRetracted(): boolean {
    return false;
  }
  get profile(): CardProfile {
    return new CardProfile();
  }
  override get isPermanent(): boolean {
    return false;
  }
  abstract get discipline(): TacticDiscipline;
  protected onlyColonyTarget(playersCardStacks: CardStack[]): CardStack[] {
    return playersCardStacks.filter((cs) => cs.card.type == CardType.Colony);
  }
}
