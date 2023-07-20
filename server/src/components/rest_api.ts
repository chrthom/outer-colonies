import { Express } from 'express';
import fetch from 'node-fetch';
import Auth from './utils/auth';
import {
  AuthExistsResponse,
  AuthLoginRequest,
  AuthLoginResponse,
  AuthRegisterRequest,
  DailyGetResponse,
  DeckListResponse,
  ItemListResponse,
  OpenItemResponse,
  ProfileGetResponse,
} from './shared_interfaces/rest_api';
import DBDecksDAO, { DBDeck } from './persistence/db_decks';
import DBCredentialsDAO from './persistence/db_credentials';
import CardCollection from './cards/collection/card_collection';
import Card from './cards/card';
import config from 'config';
import DBProfilesDAO, { DBProfile } from './persistence/db_profiles';
import DBDailiesDAO, { DBDaily } from './persistence/db_dailies';
import DBItemsDAO, { DBItem, DBItemBoxContent } from './persistence/db_items';
import { ItemBoxContentType, ItemType } from './config/enums';
import { rules } from './config/rules';

export default function restAPI(app: Express) {
  // Forward to assets to by-pass CORS issues
  app.get('/assets/*', (req, res) => {
    const file = req.path.replace('/assets/', '');
    fetch(`${config.get('url.assets')}/${file}`).then((actual) => actual.body.pipe(res));
  });

  // Register new user
  app.post('/api/auth/register', (req, res) => {
    Auth.register(<AuthRegisterRequest>req.body).then((success) =>
      success ? res.status(201).send({}) : res.sendStatus(500),
    );
  });

  // Login
  app.post('/api/auth/login', (req, res) => {
    Auth.login(<AuthLoginRequest>req.body).then((sessionToken) => {
      const payload: AuthLoginResponse = {
        success: sessionToken != null,
        sessionToken: sessionToken,
      };
      res.send(payload);
    });
  });

  // Check if username or email exists
  app.get('/api/auth/exists', (req, res) => {
    const sendExistsResponse = (exists: boolean) => {
      const payload: AuthExistsResponse = {
        exists: exists,
      };
      res.send(payload);
    };
    if (req.query.username) Auth.checkUsernameExists(String(req.query.username)).then(sendExistsResponse);
    else if (req.query.email) Auth.checkEmailExists(String(req.query.email)).then(sendExistsResponse);
    else res.sendStatus(400);
  });

  // List all cards
  app.get('/api/deck', (req, res) => {
    const toDeckCard = (c: DBDeck) => {
      const cardData: Card = CardCollection.cards[c.cardId];
      return {
        id: c.cardInstanceId,
        cardId: c.cardId,
        name: cardData.name,
        rarity: cardData.rarity,
        type: cardData.type,
        inUse: c.inUse,
      };
    };
    const sendDeckResponse = (cards: DBDeck[]) => {
      const payload: DeckListResponse = {
        cards: cards.map(toDeckCard),
      };
      res.send(payload);
    };
    const sessionToken = req.header('session-token');
    if (sessionToken) {
      DBCredentialsDAO.getBySessionToken(sessionToken).then((u) => {
        if (u) {
          DBDecksDAO.getByUserId(u.userId).then(sendDeckResponse);
        } else {
          res.sendStatus(403);
        }
      });
    } else {
      res.sendStatus(400);
    }
  });

  // Add a card to the active deck
  app.post('/api/deck/:cardInstanceId(\\d+)', (req, res) => {
    DBDecksDAO.setInUse(Number(req.params.cardInstanceId), true).then((_) => res.sendStatus(204));
  });

  // Remove a card from the active deck and put it to reserve
  app.delete('/api/deck/:cardInstanceId(\\d+)', (req, res) => {
    DBDecksDAO.setInUse(Number(req.params.cardInstanceId), false).then((_) => res.sendStatus(204));
  });

  // Get user profile
  app.get('/api/profile', (req, res) => {
    const sendProfileResponse = (profile: DBProfile) => {
      const payload: ProfileGetResponse = profile;
      res.send(payload);
    };
    const sessionToken = req.header('session-token');
    if (sessionToken) {
      DBCredentialsDAO.getBySessionToken(sessionToken).then((u) => {
        if (u) {
          DBProfilesDAO.getByUserId(u.userId).then(sendProfileResponse);
        } else {
          res.sendStatus(403);
        }
      });
    } else {
      res.sendStatus(400);
    }
  });

  // Get daily tasks of user
  app.get('/api/daily', (req, res) => {
    const sendDailyResponse = (daily: DBDaily) => {
      const payload: DailyGetResponse = daily;
      res.send(payload);
    };
    const sessionToken = req.header('session-token');
    if (sessionToken) {
      DBCredentialsDAO.getBySessionToken(sessionToken).then((u) => {
        if (u) {
          DBDailiesDAO.getByUserId(u.userId).then(sendDailyResponse);
        } else {
          res.sendStatus(403);
        }
      });
    } else {
      res.sendStatus(400);
    }
  });

  // List all items
  app.get('/api/item', (req, res) => {
    const toBox = (i: DBItem) => {
      const content = <DBItemBoxContent[]>JSON.parse(i.content);
      return {
        itemId: i.itemId,
        message: i.message,
        sol: content.filter((c) => c.type == ItemBoxContentType.Sol).map((c) => c.value),
        cards: content.filter((c) => c.type == ItemBoxContentType.Card).map((c) => c.value),
        boosters: content.filter((c) => c.type == ItemBoxContentType.Booster).map((c) => c.value),
      };
    };
    const toBooster = (i: DBItem) => {
      const content = <DBItemBoxContent[]>JSON.parse(i.content);
      return {
        itemId: i.itemId,
        no: Number(i.content),
      };
    };
    const sendItemResponse = (items: DBItem[]) => {
      const payload: ItemListResponse = {
        boxes: items.filter((i) => i.type == ItemType.Box).map(toBox),
        boosters: items.filter((i) => i.type == ItemType.Booster).map(toBooster),
      };
      res.send(payload);
    };
    const sessionToken = req.header('session-token');
    if (sessionToken) {
      DBCredentialsDAO.getBySessionToken(sessionToken).then((u) => {
        if (u) {
          DBItemsDAO.getByUserId(u.userId).then(sendItemResponse);
        } else {
          res.sendStatus(403);
        }
      });
    } else {
      res.sendStatus(400);
    }
  });

  // Open an item
  app.post('/api/item/:itemId(\\d+)', (req, res) => {
    const itemId = Number(req.params.itemId);
    const sessionToken = req.header('session-token');
    //
    if (sessionToken) {
      DBCredentialsDAO.getBySessionToken(sessionToken).then((u) => {
        if (u) {
          DBItemsDAO.getByUserId(u.userId).then((items) => {
            const item = items.find((i) => i.itemId == itemId);
            if (item) {
              DBItemsDAO.delete(itemId);
              if (item.type == ItemType.Booster) {
                const cards = CardCollection.generateBooster(Number(item.content)).map((c) => c.id);
                cards.forEach((cId) => DBDecksDAO.create(cId, u.userId, false, true));
                const response: OpenItemResponse = {
                  itemId: item.itemId,
                  message: item.message,
                  sol: [],
                  cards: cards,
                  boosters: [],
                };
                res.send(response);
              } else if (item.type == ItemType.Box) {
                const content = <DBItemBoxContent[]>JSON.parse(item.content);
                content.forEach((e) => {
                  switch (e.type) {
                    case ItemBoxContentType.Booster:
                      DBItemsDAO.createBooster(u.userId, e.value);
                      break;
                    case ItemBoxContentType.Card:
                      DBDecksDAO.create(e.value, u.userId);
                      break;
                    case ItemBoxContentType.Sol:
                      DBProfilesDAO.increaseSol(u.userId, e.value);
                  }
                });
                const response: OpenItemResponse = {
                  itemId: item.itemId,
                  message: item.message,
                  sol: content.filter((c) => c.type == ItemBoxContentType.Sol).map((c) => c.value),
                  cards: content.filter((c) => c.type == ItemBoxContentType.Card).map((c) => c.value),
                  boosters: content.filter((c) => c.type == ItemBoxContentType.Booster).map((c) => c.value),
                };
                res.send(response);
              }
            } else {
              res.sendStatus(401);
            }
          });
        } else {
          res.sendStatus(403);
        }
      });
    } else {
      res.sendStatus(400);
    }
  });

  // Buy a booster pack
  app.post('/api/buy/booster/:boosterNo([1-4])', (req, res) => {
    const boosterNo = Number(req.params.boosterNo);
    const sessionToken = req.header('session-token');
    if (sessionToken) {
      DBCredentialsDAO.getBySessionToken(sessionToken).then((u) => {
        if (u) {
          DBProfilesDAO.decreaseSol(u.userId, rules.boosterCosts[boosterNo]).then((sufficientSol) => {
            if (sufficientSol) {
              DBItemsDAO.createBooster(u.userId, boosterNo).then((_) => res.status(201).send({}));
            } else {
              res.sendStatus(400);
            }
          });
        } else {
          res.sendStatus(403);
        }
      });
    } else {
      res.sendStatus(400);
    }
  });
}
