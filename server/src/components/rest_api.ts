import { Express, Request, Response } from 'express';
import fetch from 'node-fetch';
import Auth from './utils/auth';
import {
  AuthExistsResponse,
  AuthLoginResponse,
  AuthRegistrationResponse,
  DailyGetResponse,
  DeckCard,
  DeckListResponse,
  ItemListResponse,
  ItemListResponseBox,
  ProfileGetResponse
} from '../shared/interfaces/rest_api';
import { sendStatus } from './utils/api_response';
import {
  authEmailSchema,
  authExistsQuerySchema,
  authLoginSchema,
  authPasswordResetUserSchema,
  authPasswordSchema,
  authRegisterSchema,
  oneTimeIdSchema,
  validateBody,
  validateParams,
  validateQuery
} from './utils/request_validation';
import {
  existsRateLimiter,
  loginRateLimiter,
  passwordResetRateLimiter,
  registerRateLimiter
} from './utils/rate_limiter';
import DBDecksDAO, { DBDeck } from './persistence/db_decks';
import DBCredentialsDAO, { DBCredentialWithSessionToken } from './persistence/db_credentials';
import CardCollection from './cards/collection/card_collection';
import Card from './cards/card';
import config from 'config';
import DBProfilesDAO, { DBProfile } from './persistence/db_profiles';
import DBDailiesDAO, { DBDaily } from './persistence/db_dailies';
import DBItemsDAO, { DBItem, DBItemBoxContent } from './persistence/db_items';
import DBConnection from './persistence/db_connector';
import { APIRejectReason, CardType, ItemBoxContentType, ItemType } from '../shared/config/enums';
import { rules } from '../shared/config/rules';
import TacticCard from './cards/types/tactic_card';
import { getDailiesOfDay } from './utils/daily_selector';
import { DAILY_DEFINITIONS } from '../shared/config/dailies';
import EquipmentCard from './cards/types/equipment_card';

function performWithSessionTokenCheck(
  req: Request,
  res: Response,
  f: (u: DBCredentialWithSessionToken) => void
) {
  const sessionToken = req.header('session-token');
  if (sessionToken) {
    DBCredentialsDAO.getBySessionToken(sessionToken).then(
      credentials => f(credentials),
      reason => sendStatus(res, reason == APIRejectReason.NotFound ? 403 : 500)
    );
  } else {
    sendStatus(res, 401, 'No session-token header provided');
  }
}

export default function restAPI(app: Express) {
  // Forward to assets to by-pass CORS issues
  app.get('/assets/*', (req, res) => {
    const file = req.path.replace('/assets/', '');
    fetch(`${config.get('url.assets')}/${file}`)
      .then(actual => {
        if (!actual.body) {
          console.log(`WARN: Assets response for ${file} has no body, responding with 502`);
          res.status(502).end();
          return;
        }
        actual.body.pipe(res).on('error', err => {
          console.log(`WARN: Assets stream for ${file} failed: ${err}, responding with 502`);
          res.status(502).end();
        });
      })
      .catch(err => {
        console.log(`WARN: Fetching asset ${file} failed: ${err}, responding with 502`);
        res.status(502).end();
      });
  });

  app.post('/api/auth/register', registerRateLimiter, (req, res) => {
    const registerRequest = validateBody(authRegisterSchema, req, res);
    if (!registerRequest) return;
    Auth.checkUsernameExists(registerRequest.username)
      .then(exists => (exists ? Promise.reject('Username') : Promise.resolve()))
      .then(() => Auth.checkEmailExists(registerRequest.email))
      .then(exists => (exists ? Promise.reject('Email') : Promise.resolve()))
      .then(() => Auth.register(registerRequest))
      .then(credential => {
        const payload: AuthRegistrationResponse = {
          id: credential.userId,
          username: credential.username
        };
        res.status(201).send(payload);
      })
      .catch(error =>
        sendStatus(
          res,
          error == 'Username' || error == 'Email' ? 409 : 500,
          error == 'Username' || error == 'Email' ? `${error} already exists` : undefined
        )
      );
  });

  app.put('/api/auth/register/:id', (req, res) => {
    const params = validateParams(oneTimeIdSchema, req, res);
    if (!params) return;
    Auth.activateAccount(params.id).then(
      () => sendStatus(res, 204),
      reason => sendStatus(res, reason == APIRejectReason.NotFound ? 404 : 500)
    );
  });

  app.post('/api/auth/login', loginRateLimiter, (req, res) => {
    const loginRequest = validateBody(authLoginSchema, req, res);
    if (!loginRequest) return;
    Auth.login(loginRequest).then(
      u => {
        const payload: AuthLoginResponse = {
          sessionToken: u.sessionToken,
          username: u.username,
          email: u.email
        };
        res.status(200).send(payload);
      },
      reason => sendStatus(res, reason == APIRejectReason.NotFound ? 401 : 500)
    );
  });

  app.get('/api/auth/login', (req, res) => {
    performWithSessionTokenCheck(req, res, u => {
      const payload: AuthLoginResponse = {
        sessionToken: u.sessionToken,
        username: u.username,
        email: u.email
      };
      res.status(200).send(payload);
    });
  });

  app.delete('/api/auth/login', (req, res) => {
    performWithSessionTokenCheck(req, res, u => {
      Auth.logout(u.sessionToken).then(
        () => sendStatus(res, 204),
        () => sendStatus(res, 500)
      );
    });
  });

  app.get('/api/auth/exists', existsRateLimiter, (req, res) => {
    const sendExistsResponse = (exists: boolean) => {
      const payload: AuthExistsResponse = {
        exists: exists
      };
      res.status(200).send(payload);
    };
    const existsQuery = validateQuery(authExistsQuerySchema, req, res);
    if (!existsQuery) return;
    if (existsQuery.username)
      Auth.checkUsernameExists(existsQuery.username).then(sendExistsResponse, () => sendStatus(res, 500));
    else if (existsQuery.email)
      Auth.checkEmailExists(existsQuery.email).then(sendExistsResponse, () => sendStatus(res, 500));
    else sendStatus(res, 400, 'No username or email parameter was provided');
  });

  app.delete('/api/auth/password/:user', passwordResetRateLimiter, (req, res) => {
    const params = validateParams(authPasswordResetUserSchema, req, res);
    if (!params) return;
    Auth.sendPasswordReset(params.user).then(
      () => sendStatus(res, 202),
      reason => sendStatus(res, reason == APIRejectReason.NotFound ? 404 : 500)
    );
  });

  app.put('/api/auth/password', (req, res) => {
    performWithSessionTokenCheck(req, res, u => {
      const passwordRequest = validateBody(authPasswordSchema, req, res);
      if (!passwordRequest) return;
      DBCredentialsDAO.setPassword(u.userId, passwordRequest.password).then(
        () => sendStatus(res, 204),
        reason => sendStatus(res, reason == APIRejectReason.NotFound ? 404 : 500)
      );
    });
  });

  app.put('/api/auth/password/:id', (req, res) => {
    const passwordRequest = validateBody(authPasswordSchema, req, res);
    if (!passwordRequest) return;
    const params = validateParams(oneTimeIdSchema, req, res);
    if (!params) return;
    Auth.resetPassword(params.id, passwordRequest.password).then(
      () => sendStatus(res, 204),
      reason => sendStatus(res, reason == APIRejectReason.NotFound ? 404 : 500)
    );
  });

  app.post('/api/auth/email', (req, res) => {
    performWithSessionTokenCheck(req, res, u => {
      const emailRequest = validateBody(authEmailSchema, req, res);
      if (!emailRequest) return;
      Auth.sendEmailConfirmation(u.userId, u.username, emailRequest.email).then(
        () => sendStatus(res, 202),
        () => sendStatus(res, 500)
      );
    });
  });

  app.put('/api/auth/email/:id', (req, res) => {
    const params = validateParams(oneTimeIdSchema, req, res);
    if (!params) return;
    Auth.resetEmail(params.id).then(
      () => sendStatus(res, 204),
      reason => sendStatus(res, reason == APIRejectReason.NotFound ? 404 : 500)
    );
  });

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
      DBDecksDAO.getByUserId(u.userId).then(sendDeckResponse, () => sendStatus(res, 500));
    });
  });

  app.post('/api/deck/:cardInstanceId(\\d+)', (req, res) => {
    performWithSessionTokenCheck(req, res, u => {
      DBDecksDAO.setInUse(u.userId, Number(req.params['cardInstanceId']), true).then(
        () => sendStatus(res, 204),
        () => sendStatus(res, 500)
      );
    });
  });

  app.delete('/api/deck/:cardInstanceId(\\d+)', (req, res) => {
    performWithSessionTokenCheck(req, res, u => {
      DBDecksDAO.setInUse(u.userId, Number(req.params['cardInstanceId']), false).then(
        () => sendStatus(res, 204),
        () => sendStatus(res, 500)
      );
    });
  });

  app.get('/api/profile', (req, res) => {
    const sendProfileResponse = (profile: DBProfile) => {
      const payload: ProfileGetResponse = profile;
      res.status(200).send(payload);
    };
    performWithSessionTokenCheck(req, res, u => {
      DBProfilesDAO.getByUserId(u.userId).then(sendProfileResponse, reason =>
        sendStatus(res, reason == APIRejectReason.NotFound ? 404 : 500)
      );
    });
  });

  app.put('/api/profile/newsletter', (req, res) => {
    performWithSessionTokenCheck(req, res, u => {
      DBProfilesDAO.setNewsletter(u.userId, true).then(
        () => sendStatus(res, 204),
        () => sendStatus(res, 500)
      );
    });
  });

  app.delete('/api/profile/newsletter', (req, res) => {
    performWithSessionTokenCheck(req, res, u => {
      DBProfilesDAO.setNewsletter(u.userId, false).then(
        () => sendStatus(res, 204),
        () => sendStatus(res, 500)
      );
    });
  });

  app.get('/api/daily', (req, res) => {
    performWithSessionTokenCheck(req, res, u => {
      DBDailiesDAO.getByUserId(u.userId).then(
        daily => res.status(200).send(getDailiesResponse(daily)),
        reason => sendStatus(res, reason == APIRejectReason.NotFound ? 404 : 500)
      );
    });
  });

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
      DBItemsDAO.getByUserId(u.userId).then(sendItemResponse, () => sendStatus(res, 500));
    });
  });

  app.post('/api/item/:itemId(\\d+)', (req, res) => {
    const itemId = Number(req.params['itemId']);
    performWithSessionTokenCheck(req, res, u => {
      openItem(u.userId, itemId).then(
        response => res.status(200).send(response),
        reason =>
          reason == APIRejectReason.NotFound
            ? sendStatus(res, 404)
            : reason == INVALID_ITEM_TYPE
              ? sendStatus(res, 400, 'Invalid item type')
              : sendStatus(res, 500)
      );
    });
  });

  app.post('/api/buy/booster/:boosterNo([1-5])', (req, res) => {
    const boosterNo = Number(req.params['boosterNo']);
    performWithSessionTokenCheck(req, res, u => {
      buyBooster(u.userId, boosterNo).then(
        () => sendStatus(res, 201),
        reason => {
          switch (reason) {
            case APIRejectReason.ConditionNotMet:
              sendStatus(res, 400, 'Insufficient sol');
              break;
            case APIRejectReason.NotFound:
              sendStatus(res, 404, 'User not found');
              break;
            default:
              sendStatus(res, 500);
          }
        }
      );
    });
  });
}

/**
 * Single source of truth for projecting a DB daily row into the wire payload:
 * values for dailies active today are preserved, the rest are nulled out.
 */
export function getDailiesResponse(daily: DBDaily): DailyGetResponse {
  const dailiesOfDay = getDailiesOfDay();
  const typedPayload: DailyGetResponse = {} as DailyGetResponse;
  DAILY_DEFINITIONS.forEach(dailyDef => {
    const dailyValue = daily[dailyDef.dbColumn];
    typedPayload[dailyDef.dbColumn as keyof DailyGetResponse] = dailiesOfDay.includes(dailyDef.type)
      ? dailyValue
      : null;
  });
  return typedPayload;
}

/** Thin wrapper that fetches and projects in one call; retained for tests. */
export async function getDailies(userId: number): Promise<DailyGetResponse> {
  const daily = await DBDailiesDAO.getByUserId(userId);
  return getDailiesResponse(daily);
}

/** Sentinel rejection value for items whose type is neither box nor booster. */
export const INVALID_ITEM_TYPE = 'invalid_item_type';

/**
 * Opens an item in a single database transaction: the item is deleted and all granted cards, sol
 * and boosters are inserted before the transaction commits. The delete is guarded by an
 * affected-rows check, so a concurrent open of the same item rejects with
 * `APIRejectReason.NotFound` instead of granting the content twice. Rejects with
 * `APIRejectReason.NotFound` if the user owns no such item and with `INVALID_ITEM_TYPE` for
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
      return Promise.reject(INVALID_ITEM_TYPE);
    }
  });
}

/**
 * Buys a booster pack in a single database transaction: the sol decrease and the booster item
 * creation commit together or not at all. Rejects with `APIRejectReason.ConditionNotMet` if the
 * user cannot afford the booster and with `APIRejectReason.NotFound` if the user is unknown.
 * @param userId id of the buying user
 * @param boosterNo edition number of the booster to buy
 */
export async function buyBooster(userId: number, boosterNo: number): Promise<void> {
  return DBConnection.instance.transaction(async () => {
    await DBProfilesDAO.decreaseSol(userId, rules.boosterCosts[boosterNo]);
    await DBItemsDAO.createBooster(userId, boosterNo);
  });
}
