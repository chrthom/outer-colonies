import { Express, Request, Response } from 'express';
import fetch from 'node-fetch';
import Auth from './utils/auth';
import {
  AuthExistsResponse,
  AuthLoginRequest,
  AuthLoginResponse,
  AuthPasswordRequest,
  AuthRegisterRequest,
  AuthRegistrationResponse,
  DailyGetResponse,
  DeckCard,
  DeckListResponse,
  GenericResponse,
  ItemListResponse,
  ItemListResponseBox,
  ProfileGetResponse
} from '../shared/interfaces/rest_api';
import DBDecksDAO, { DBDeck } from './persistence/db_decks';
import DBCredentialsDAO, { DBCredentialWithSessionToken } from './persistence/db_credentials';
import CardCollection from './cards/collection/card_collection';
import Card from './cards/card';
import config from 'config';
import DBProfilesDAO, { DBProfile } from './persistence/db_profiles';
import DBDailiesDAO, { DBDaily } from './persistence/db_dailies';
import DBItemsDAO, { DBItem, DBItemBoxContent } from './persistence/db_items';
import { CardType, ItemBoxContentType, ItemType } from '../shared/config/enums';
import { rules } from '../shared/config/rules';
import TacticCard from './cards/types/tactic_card';
import EquipmentCard from './cards/types/equipment_card';

function performWithSessionTokenCheck(
  req: Request,
  res: Response,
  f: (u: DBCredentialWithSessionToken) => void
) {
  const sessionToken = req.header('session-token');
  if (sessionToken) {
    DBCredentialsDAO.getBySessionToken(sessionToken).then(u => (u ? f(u) : sendStatus(res, 403)));
  } else {
    sendStatus(res, 401, 'No session-token header provided');
  }
}

function sendStatus(res: Response, status: number, message?: string) {
  const r: GenericResponse = {
    status: status
  };
  if (message) {
    r.message = message;
  } else {
    switch (status) {
      case 200:
        r.message = 'OK';
        break;
      case 201:
        r.message = 'Created';
        break;
      case 202:
        r.message = 'Accepted';
        break;
      case 204:
        r.message = 'No Content';
        break;
      case 400:
        r.message = 'Bad Request';
        break;
      case 401:
        r.message = 'Unauthorized';
        break;
      case 403:
        r.message = 'Forbidden';
        break;
      case 404:
        r.message = 'Not Found';
        break;
      case 409:
        r.message = 'Conflict';
        break;
      case 500:
        r.message = 'Internal Server Error';
        break;
    }
  }
  res.status(status).send(r);
}

export default function restAPI(app: Express) {
  // Forward to assets to by-pass CORS issues
  app.get('/assets/*', (req, res) => {
    const file = req.path.replace('/assets/', '');
    fetch(`${config.get('url.assets')}/${file}`).then(actual => actual.body.pipe(res));
  });

  // Register new user
  app.post('/api/auth/register', (req, res) => {
    const registerRequest = <AuthRegisterRequest>req.body;
    Auth.checkUsernameExists(registerRequest.username).then(usernameExists => {
      if (usernameExists) {
        sendStatus(res, 409, 'Username already exists');
      } else {
        Auth.checkEmailExists(registerRequest.email).then(emailExists => {
          if (emailExists) {
            sendStatus(res, 409, 'Email already exists');
          } else {
            Auth.register(registerRequest).then(credential => {
              const payload: AuthRegistrationResponse = {
                id: credential.userId,
                username: credential.username
              };
              res.status(201).send(payload);
            });
          }
        });
      }
    });
  });

  // Login
  app.post('/api/auth/login', (req, res) => {
    Auth.login(<AuthLoginRequest>req.body).then(
      usernameAndToken => {
        const payload: AuthLoginResponse = {
          sessionToken: usernameAndToken[1],
          username: usernameAndToken[0]
        };
        res.status(200).send(payload);
      },
      () => sendStatus(res, 401)
    );
  });

  // Get user by session token
  app.get('/api/auth/login', (req, res) => {
    performWithSessionTokenCheck(req, res, u => {
      const payload: AuthLoginResponse = {
        sessionToken: u.sessionToken,
        username: u.username
      };
      res.status(200).send(payload);
    });
  });

  // Logout
  app.delete('/api/auth/login', (req, res) => {
    performWithSessionTokenCheck(req, res, u => {
      Auth.logout(u.sessionToken);
      sendStatus(res, 204);
    });
  });

  // Check if username or email exists
  app.get('/api/auth/exists', (req, res) => {
    const sendExistsResponse = (exists: boolean) => {
      const payload: AuthExistsResponse = {
        exists: exists
      };
      res.status(200).send(payload);
    };
    if (req.query['username'])
      Auth.checkUsernameExists(String(req.query['username'])).then(sendExistsResponse);
    else if (req.query['email']) Auth.checkEmailExists(String(req.query['email'])).then(sendExistsResponse);
    else sendStatus(res, 400, 'No username or email parameter was provided');
  });

  // Send password reset link
  app.delete('/api/auth/password/:user', (req, res) => {
    Auth.sendPasswordReset(String(req.params['user'])).then(
      () => sendStatus(res, 202),
      reason => sendStatus(res, reason == 'not found' ? 400 : 500)
    );
  });

  app.post('/api/auth/password/:id', (req, res) => {
    Auth.resetPassword(String(req.params['id']), (<AuthPasswordRequest>req.body).password).then(
      () => sendStatus(res, 201),
      reason => sendStatus(res, reason == 'not found' ? 400 : 500)
    );
  });

  // List all cards
  app.get('/api/deck', (req, res) => {
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
    const sendDeckResponse = (cards: DBDeck[]) => {
      const payload: DeckListResponse = {
        cards: cards.map(toDeckCard)
      };
      res.status(200).send(payload);
    };
    performWithSessionTokenCheck(req, res, u => {
      DBDecksDAO.getByUserId(u.userId).then(sendDeckResponse);
    });
  });

  // Add a card to the active deck
  app.post('/api/deck/:cardInstanceId(\\d+)', (req, res) => {
    DBDecksDAO.setInUse(Number(req.params['cardInstanceId']), true).then(() => sendStatus(res, 204));
  });

  // Remove a card from the active deck and put it to reserve
  app.delete('/api/deck/:cardInstanceId(\\d+)', (req, res) => {
    DBDecksDAO.setInUse(Number(req.params['cardInstanceId']), false).then(() => sendStatus(res, 204));
  });

  // Get user profile
  app.get('/api/profile', (req, res) => {
    const sendProfileResponse = (profile: DBProfile | undefined) => {
      if (profile) {
        const payload: ProfileGetResponse = profile;
        res.status(200).send(payload);
      } else {
        sendStatus(res, 404);
      }
    };
    performWithSessionTokenCheck(req, res, u => {
      DBProfilesDAO.getByUserId(u.userId).then(sendProfileResponse);
    });
  });

  // Get daily tasks of user
  app.get('/api/daily', (req, res) => {
    const sendDailyResponse = (daily: DBDaily | undefined) => {
      if (daily) {
        const payload: DailyGetResponse = daily;
        res.status(200).send(payload);
      } else {
        sendStatus(res, 404);
      }
    };
    performWithSessionTokenCheck(req, res, u => {
      DBDailiesDAO.getByUserId(u.userId).then(sendDailyResponse);
    });
  });

  // List all items
  app.get('/api/item', (req, res) => {
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
    const sendItemResponse = (items: DBItem[]) => {
      const payload: ItemListResponse = {
        boxes: items.filter(i => i.type == ItemType.Box).map(toBox),
        boosters: items.filter(i => i.type == ItemType.Booster).map(toBooster)
      };
      res.status(200).send(payload);
    };
    performWithSessionTokenCheck(req, res, u => {
      DBItemsDAO.getByUserId(u.userId).then(sendItemResponse);
    });
  });

  // Open an item
  app.post('/api/item/:itemId(\\d+)', (req, res) => {
    const itemId = Number(req.params['itemId']);
    performWithSessionTokenCheck(req, res, u => {
      DBItemsDAO.getByUserId(u.userId).then(items => {
        const item = items.find(i => i.itemId == itemId);
        if (item) {
          DBItemsDAO.delete(itemId);
          if (item.type == ItemType.Booster) {
            const cards = CardCollection.generateBoosterContent(Number(item.content)).map(c => c.id);
            cards.forEach(cId => DBDecksDAO.create(cId, u.userId, false, true));
            const response: ItemListResponseBox = {
              itemId: item.itemId,
              message: item.message,
              sol: [],
              cards: cards,
              boosters: []
            };
            res.status(200).send(response);
          } else if (item.type == ItemType.Box) {
            const content = <DBItemBoxContent[]>JSON.parse(item.content);
            content.forEach(e => {
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
            const response: ItemListResponseBox = {
              itemId: item.itemId,
              message: item.message,
              sol: content.filter(c => c.type == ItemBoxContentType.Sol).map(c => c.value),
              cards: content.filter(c => c.type == ItemBoxContentType.Card).map(c => c.value),
              boosters: content.filter(c => c.type == ItemBoxContentType.Booster).map(c => c.value)
            };
            res.status(200).send(response);
          }
        } else {
          sendStatus(res, 404);
        }
      });
    });
  });

  // Buy a booster pack
  app.post('/api/buy/booster/:boosterNo([1-4])', (req, res) => {
    const boosterNo = Number(req.params['boosterNo']);
    performWithSessionTokenCheck(req, res, u => {
      DBProfilesDAO.decreaseSol(u.userId, rules.boosterCosts[boosterNo]).then(sufficientSol => {
        if (sufficientSol) {
          DBItemsDAO.createBooster(u.userId, boosterNo).then(() => sendStatus(res, 204));
        } else {
          sendStatus(res, 400, 'Insufficient sol');
        }
      });
    });
  });
}
