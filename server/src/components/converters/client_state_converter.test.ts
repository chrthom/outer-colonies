import { Socket } from 'socket.io';
import {
  CardType,
  EventType,
  InterventionType,
  TacticDiscipline,
  TurnPhase,
  Zone
} from '../../shared/config/enums';
import { constants } from '../../shared/config/constants';
import Card from '../cards/card';
import CardStack, { AttachmentCardStack, RootCardStack } from '../cards/card_stack';
import { CardProfileConfig } from '../cards/card_profile';
import TacticCard from '../cards/types/tactic_card';
import Match from '../game_state/match';
import Player from '../game_state/player';
import toClientState from './client_state_converter';

class MockCard extends Card {
  constructor(id: number, type: CardType = CardType.Equipment, profile: CardProfileConfig = {}) {
    super(id, `Mock ${id}`, type, 1, profile);
  }
  getValidTargets(): CardStack[] {
    return [];
  }
  onEnterGame() {}
  onLeaveGame() {}
  onStartTurn() {}
  onEndTurn() {}
}

// Playable on the opposing colony, so the opponent can open the tactic card reveal window
class PlayableTacticCard extends TacticCard {
  constructor(id: number = 9901) {
    super(id, 'Playable Tactic (Test)', 1, TacticDiscipline.Military);
  }
  onEnterGame() {}
  getValidTargets(player: Player): CardStack[] {
    return this.onlyOpponentColonyTarget(player);
  }
}

// Keeps the intervention window open, so the played tactic card stays revealed
class CounterTacticCard extends TacticCard {
  constructor() {
    super(9902, 'Counter Tactic (Test)', 1, TacticDiscipline.Intelligence);
  }
  onEnterGame(player: Player) {
    this.onEnterGameInterventionTacticCard(player);
  }
  getValidTargets(player: Player): CardStack[] {
    return this.getValidTargetsInterventionTacticCard(player, [TacticDiscipline.Military]);
  }
  protected override get interventionType(): InterventionType | undefined {
    return InterventionType.TacticCard;
  }
}

const createSocket = (playerNo: number): Socket =>
  ({
    id: `socket-${playerNo}`,
    join: jest.fn(),
    data: {
      user: { username: `Player ${playerNo}` },
      activeDeck: [0, 1, 2, 3].map(i => new MockCard(100 * playerNo + i))
    }
  }) as unknown as Socket;

const createMatch = (): Match => {
  const match = new Match('test-room', createSocket(0), createSocket(1));
  match.activePlayerNo = 1;
  match.pendingActionPlayerNo = 1;
  match.turnPhase = TurnPhase.Build;
  return match;
};

const addHandCard = (player: Player, card: Card): CardStack => {
  const handCard = new RootCardStack(card, Zone.Hand, player);
  player.hand.push(handCard);
  return handCard;
};

describe('toClientState', () => {
  let match: Match;

  beforeEach(() => {
    match = createMatch();
  });

  describe('hand card redaction', () => {
    test('redacts hand cards of the opponent', () => {
      addHandCard(match.players[1], new MockCard(111));
      addHandCard(match.players[1], new MockCard(112));

      const state = toClientState(match, 0);

      expect(state.opponent.hand).toHaveLength(2);
      state.opponent.hand.forEach(card => {
        expect(card.cardId).toBe(constants.cardBackSideID);
        expect(card.playable).toBe(false);
        expect(card.validTargets).toEqual([]);
        expect(card.optionsToSelect).toBe(0);
        expect(card.options).toEqual([]);
        expect(card.ownedByPlayer).toBe(false);
      });
    });

    test('keeps own hand cards of the requesting player unredacted', () => {
      const ownCard = addHandCard(match.players[0], new MockCard(211));

      const state = toClientState(match, 0);

      expect(state.player.hand).toHaveLength(1);
      expect(state.player.hand[0].uuid).toBe(ownCard.uuid);
      expect(state.player.hand[0].cardId).toBe(211);
      expect(state.player.hand[0].ownedByPlayer).toBe(true);
    });

    test('reveals only the card ID of a hand card revealed via highlightCardUUID', () => {
      const revealedCard = addHandCard(match.players[1], new PlayableTacticCard(113));
      match.highlightCard = revealedCard;

      const state = toClientState(match, 0);

      const revealedHandCard = state.opponent.hand.find(c => c.uuid == revealedCard.uuid);
      expect(revealedHandCard?.cardId).toBe(113);
      // The card is playable for its owner, so the redacted fields prove the exception covers only the card ID
      expect(revealedCard.hasValidTargets).toBe(true);
      expect(revealedHandCard?.playable).toBe(false);
      expect(revealedHandCard?.validTargets).toEqual([]);
      expect(revealedHandCard?.optionsToSelect).toBe(0);
      expect(revealedHandCard?.options).toEqual([]);
    });
  });

  describe('events', () => {
    // Creates an orbital ship stack (with one non-retractable equipment card) for player 0 and
    // retracts it, producing one retract and one discard movement event.
    const retractShipWithEquipment = (): { ship: CardStack; equipment: CardStack } => {
      const player = match.players[0];
      const ship = new RootCardStack(new MockCard(1, CardType.Hull), Zone.Orbital, player);
      const equipment = new AttachmentCardStack(new MockCard(2, CardType.Equipment), ship);
      ship.attach(equipment);
      jest.spyOn(equipment.card, 'canBeRetracted').mockReturnValue(false);
      player.cardStacks.push(ship);
      ship.retract();
      return { ship, equipment };
    };

    // Attaches a tactic card played by player 0 to player 1's orbital ship and discards it,
    // producing one discard movement event whose card is routed to the playing player.
    const discardAttachmentOnOpponentStack = (): CardStack => {
      const caster = match.players[0];
      const opponent = match.players[1];
      const opponentShip = new RootCardStack(new MockCard(5, CardType.Hull), Zone.Orbital, opponent);
      const tactic = new RootCardStack(new MockCard(6, CardType.Tactic), Zone.Hand, caster);
      opponentShip.attach(tactic);
      opponent.cardStacks.push(opponentShip);
      tactic.discard();
      return tactic;
    };

    test('attaches the movement events with playerEvent = true for the owning player', () => {
      const { ship, equipment } = retractShipWithEquipment();

      const state = toClientState(match, 0);

      expect(state.events).toEqual([
        { type: EventType.Discard, playerEvent: true, oldUUID: equipment.uuid },
        { type: EventType.Retract, playerEvent: true, oldUUID: ship.uuid, newUUID: expect.any(String) }
      ]);
      expect(state.player.hand.map(h => h.uuid)).toContain(state.events[1].newUUID);
    });

    test('attaches the same movement events with playerEvent = false for the opponent', () => {
      const { ship, equipment } = retractShipWithEquipment();

      const state = toClientState(match, 1);

      expect(state.events).toEqual([
        { type: EventType.Discard, playerEvent: false, oldUUID: equipment.uuid },
        { type: EventType.Retract, playerEvent: false, oldUUID: ship.uuid, newUUID: expect.any(String) }
      ]);
    });

    test('attributes the discard of an attachment on an opponent stack to the caster', () => {
      const tactic = discardAttachmentOnOpponentStack();

      const state = toClientState(match, 0);

      expect(state.events).toEqual([{ type: EventType.Discard, playerEvent: true, oldUUID: tactic.uuid }]);
      expect(state.player.discardPileIds).toContain(tactic.card.id);
    });

    test('attaches the same discard event with playerEvent = false for the host stack player', () => {
      const tactic = discardAttachmentOnOpponentStack();

      const state = toClientState(match, 1);

      expect(state.events).toEqual([{ type: EventType.Discard, playerEvent: false, oldUUID: tactic.uuid }]);
      expect(state.opponent.discardPileIds).toContain(tactic.card.id);
    });

    test('contains an empty event list when no cards were moved', () => {
      const state = toClientState(match, 0);

      expect(state.events).toEqual([]);
    });
  });

  describe('tactic card reveal', () => {
    test('provides the real card ID of the played tactic card via the state', () => {
      const counterCard = addHandCard(match.players[0], new CounterTacticCard());
      const tacticCard = addHandCard(match.players[1], new PlayableTacticCard(123));

      match.players[1].playHandCard(tacticCard, match.players[0].colonyCardStack);

      // The counter card keeps the intervention window open, so the tactic card stays revealed
      expect(match.intervention).toBeDefined();
      expect(match.highlightCard?.uuid).toBe(tacticCard.uuid);

      const state = toClientState(match, 0);

      expect(state.highlightCardUUID).toBe(tacticCard.uuid);
      expect(state.highlightCardId).toBe(123);
      expect(state.opponent.hand.some(c => c.uuid == tacticCard.uuid)).toBe(false);
      expect(state.opponent.hand.every(c => c.cardId == constants.cardBackSideID)).toBe(true);
      const ownCard = state.player.hand.find(c => c.uuid == counterCard.uuid);
      expect(ownCard?.cardId).toBe(9902);
      expect(ownCard?.playable).toBe(true);
      expect(ownCard?.validTargets).toEqual([match.players[1].colonyCardStack.uuid]);
    });
  });
});
