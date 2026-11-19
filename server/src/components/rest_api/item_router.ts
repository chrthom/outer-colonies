import { Router } from 'express';
import DBItemsDAO, { DBItem, DBItemBoxContent } from '../persistence/db_items';
import DBDecksDAO from '../persistence/db_decks';
import DBProfilesDAO from '../persistence/db_profiles';
import DBConnection from '../persistence/db_connector';
import CardCollection from '../cards/collection/card_collection';
import { APIRejectReason, ItemBoxContentType, ItemType } from '../../shared/config/enums';
import { ItemListResponse, ItemListResponseBox } from '../../shared/interfaces/rest_api';
import { ApiError, asyncRoute } from './api_error';
import { requireSession, sessionCredentials } from './session_middleware';

const itemRouter = Router();

itemRouter.get(
  '/api/item',
  requireSession,
  asyncRoute(async (req, res) => {
    const toBox = (i: DBItem) => {
      const content = <DBItemBoxContent[]>JSON.parse(i.content);
      const payload: ItemListResponseBox = {
        itemId: i.itemId,
        message: i.message,
        sol: content.filter(c => c.type == ItemBoxContentType.Sol).map(c => c.value),
        cards: content.filter(c => c.type == ItemBoxContentType.Card).map(c => c.value),
        boosters: content.filter(c => c.type == ItemBoxContentType.Booster).map(c => c.value)
      };
      return payload;
    };
    const toBooster = (i: DBItem) => {
      return {
        itemId: i.itemId,
        no: Number(i.content)
      };
    };
    const items = await DBItemsDAO.getByUserId(sessionCredentials(res).userId);
    const payload: ItemListResponse = {
      boxes: items.filter(i => i.type == ItemType.Box).map(toBox),
      boosters: items.filter(i => i.type == ItemType.Booster).map(toBooster)
    };
    res.status(200).send(payload);
  })
);

itemRouter.post(
  '/api/item/:itemId(\\d+)',
  requireSession,
  asyncRoute(
    async (req, res) => {
      const response = await openItem(sessionCredentials(res).userId, Number(req.params['itemId']));
      res.status(200).send(response);
    },
    {
      [APIRejectReason.NotFound]: [404]
    }
  )
);

/**
 * Opens an item in a single database transaction: the item is deleted and all granted cards, sol
 * and boosters are inserted before the transaction commits. The delete is guarded by an
 * affected-rows check, so a concurrent open of the same item rejects with
 * `APIRejectReason.NotFound` instead of granting the content twice. Rejects with
 * `APIRejectReason.NotFound` if the user owns no such item and with an `ApiError` (400) for
 * unknown item types; any failure rolls the whole operation back.
 * @param userId id of the user opening the item
 * @param itemId id of the item to open
 * @returns the opened item content for the response payload
 */
export async function openItem(userId: number, itemId: number): Promise<ItemListResponseBox> {
  return DBConnection.instance.transaction(async () => {
    const items = await DBItemsDAO.getByUserId(userId);
    const item = items.find(i => i.itemId == itemId);
    if (!item) return Promise.reject(APIRejectReason.NotFound);
    if (item.type == ItemType.Booster) {
      const cards = CardCollection.generateBoosterContent(Number(item.content)).map(c => c.id);
      if ((await DBItemsDAO.delete(itemId)) == 0) return Promise.reject(APIRejectReason.NotFound);
      for (const cardId of cards) {
        await DBDecksDAO.create(cardId, userId, false, true);
      }
      return {
        itemId: item.itemId,
        message: item.message,
        sol: [],
        cards: cards,
        boosters: []
      };
    } else if (item.type == ItemType.Box) {
      const content = <DBItemBoxContent[]>JSON.parse(item.content);
      if ((await DBItemsDAO.delete(itemId)) == 0) return Promise.reject(APIRejectReason.NotFound);
      for (const entry of content) {
        switch (entry.type) {
          case ItemBoxContentType.Booster:
            await DBItemsDAO.createBooster(userId, entry.value);
            break;
          case ItemBoxContentType.Card:
            await DBDecksDAO.create(entry.value, userId);
            break;
          case ItemBoxContentType.Sol:
            await DBProfilesDAO.increaseSol(userId, entry.value);
        }
      }
      return {
        itemId: item.itemId,
        message: item.message,
        sol: content.filter(c => c.type == ItemBoxContentType.Sol).map(c => c.value),
        cards: content.filter(c => c.type == ItemBoxContentType.Card).map(c => c.value),
        boosters: content.filter(c => c.type == ItemBoxContentType.Booster).map(c => c.value)
      };
    } else {
      return Promise.reject(new ApiError(400, 'Invalid item type'));
    }
  });
}

export default itemRouter;
