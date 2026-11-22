import { Router } from 'express';
import DBDailiesDAO, { DBDaily } from '../persistence/db_dailies';
import { APIRejectReason } from '../../shared/config/enums';
import { DailyGetResponse } from '../../shared/interfaces/rest_api';
import { getDailiesOfDay } from '../utils/daily_selector';
import { DAILY_DEFINITIONS } from '../../shared/config/dailies';
import { asyncRoute } from './api_error';
import { requireSession, sessionCredentials } from './session_middleware';

const dailyRouter = Router();

dailyRouter.get(
  '/api/daily',
  requireSession,
  asyncRoute(
    async (req, res) => {
      const daily = await DBDailiesDAO.getByUserId(sessionCredentials(res).userId);
      res.status(200).send(getDailiesResponse(daily));
    },
    {
      [APIRejectReason.NotFound]: [404]
    }
  )
);

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

export default dailyRouter;
