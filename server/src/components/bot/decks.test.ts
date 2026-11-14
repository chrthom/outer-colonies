import { botDecks } from './decks';
import { starterDecks } from '../../shared/config/starter_decks';
import CardCollection from '../cards/collection/card_collection';

describe('bot decks', () => {
  test('each bot deck consists of 60 existing cards', () => {
    expect(botDecks.length).toBe(3);
    CardCollection.botDecks.forEach(deck => {
      expect(deck.length).toBe(60);
      deck.forEach(card => expect(CardCollection.allCards).toContain(card));
    });
  });

  test('is a copied definition, not a reference to the starter decks', () => {
    expect(botDecks).not.toBe(starterDecks);
    botDecks.forEach((deck, index) => expect(deck).not.toBe(starterDecks[index]));
  });

  test('currently matches the starter decks structurally', () => {
    expect(botDecks).toEqual(starterDecks);
  });
});
