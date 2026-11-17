import { Router } from 'express';
import DBProfilesDAO from '../persistence/db_profiles';
import DBItemsDAO from '../persistence/db_items';
import DBConnection from '../persistence/db_connector';
import { APIRejectReason } from '../../shared/config/enums';
import { rules } from '../../shared/config/rules';
import { asyncRoute } from './api_error';
import { sendStatus } from './api_response';
import { requireSession, sessionCredentials } from './session_middleware';

const shopRouter = Router();

shopRouter.post(
  '/api/buy/booster/:boosterNo([1-5])',
  requireSession,
  asyncRoute(
    async (req, res) => {
      await buyBooster(sessionCredentials(res).userId, Number(req.params['boosterNo']));
      sendStatus(res, 201);
    },
    {
      [APIRejectReason.ConditionNotMet]: [400, 'Insufficient sol'],
      [APIRejectReason.NotFound]: [404, 'User not found']
    }
  )
);

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

export default shopRouter;
