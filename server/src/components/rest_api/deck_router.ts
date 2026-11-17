import { Router } from 'express';
import DBDecksDAO, { DBDeck } from '../persistence/db_decks';
import CardCollection from '../cards/collection/card_collection';
import Card from '../cards/card';
import { CardType } from '../../shared/config/enums';
import { DeckCard, DeckListResponse } from '../../shared/interfaces/rest_api';
import TacticCard from '../cards/types/tactic_card';
import EquipmentCard from '../cards/types/equipment_card';
import { asyncRoute } from './api_error';
import { sendStatus } from './api_response';
import { requireSession, sessionCredentials } from './session_middleware';

const deckRouter = Router();

deckRouter.get(
  '/api/deck',
  requireSession,
  asyncRoute(async (req, res) => {
    const toDeckCard = (c: DBDeck) => {
      const cardData: Card = CardCollection.cards[c.cardId as keyof typeof CardCollection.cards];
      let defenseIcon: string | undefined;
      if (cardData.profile.armour > 0) defenseIcon = `armour_${cardData.profile.armour}`;
      else if (cardData.profile.shield > 0) defenseIcon = `shield_${cardData.profile.shield}`;
      else if (cardData.profile.pointDefense > 0)
        defenseIcon = `point_defense_${cardData.profile.pointDefense}`;
      const profile = cardData.profile;
      const payload: DeckCard = {
        id: c.cardInstanceId,
        inUse: c.inUse,
        cardId: c.cardId,
        name: cardData.name,
        rarity: cardData.rarity,
        type: cardData.type,
        canAttack: cardData.canAttack,
        discipline: cardData.type == CardType.Tactic ? (<TacticCard>cardData).discipline : undefined,
        hp: cardData.profile.hp > 0 ? cardData.profile.hp : undefined,
        damage:
          cardData.type == CardType.Equipment ? (<EquipmentCard>cardData).attackProfile?.damage : undefined,
        range:
          cardData.type == CardType.Equipment ? (<EquipmentCard>cardData).attackProfile?.range : undefined,
        defense: defenseIcon,
        profile: {
          energy: profile.energy,
          theta: profile.theta,
          xi: profile.xi,
          phi: profile.phi,
          omega: profile.omega,
          delta: profile.delta,
          psi: profile.psi
        }
      };
      return payload;
    };
    const cards = await DBDecksDAO.getByUserId(sessionCredentials(res).userId);
    const payload: DeckListResponse = {
      cards: cards.map(toDeckCard)
    };
    res.status(200).send(payload);
  })
);

deckRouter.post(
  '/api/deck/:cardInstanceId(\\d+)',
  requireSession,
  asyncRoute(async (req, res) => {
    await DBDecksDAO.setInUse(sessionCredentials(res).userId, Number(req.params['cardInstanceId']), true);
    sendStatus(res, 204);
  })
);

deckRouter.delete(
  '/api/deck/:cardInstanceId(\\d+)',
  requireSession,
  asyncRoute(async (req, res) => {
    await DBDecksDAO.setInUse(sessionCredentials(res).userId, Number(req.params['cardInstanceId']), false);
    sendStatus(res, 204);
  })
);

export default deckRouter;
