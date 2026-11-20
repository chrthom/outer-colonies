import { Router } from 'express';
import DBProfilesDAO from '../persistence/db_profiles';
import { APIRejectReason } from '../../shared/config/enums';
import { ProfileGetResponse } from '../../shared/interfaces/rest_api';
import { asyncRoute, RejectMapping } from './api_error';
import { sendStatus } from './api_response';
import { requireSession, sessionCredentials } from './session_middleware';

const notFound: RejectMapping = {
  [APIRejectReason.NotFound]: [404]
};

const profileRouter = Router();

profileRouter.get(
  '/api/profile',
  requireSession,
  asyncRoute(async (req, res) => {
    const profile = await DBProfilesDAO.getByUserId(sessionCredentials(res).userId);
    const payload: ProfileGetResponse = profile;
    res.status(200).send(payload);
  }, notFound)
);

profileRouter.put(
  '/api/profile/newsletter',
  requireSession,
  asyncRoute(async (req, res) => {
    await DBProfilesDAO.setNewsletter(sessionCredentials(res).userId, true);
    sendStatus(res, 204);
  })
);

profileRouter.delete(
  '/api/profile/newsletter',
  requireSession,
  asyncRoute(async (req, res) => {
    await DBProfilesDAO.setNewsletter(sessionCredentials(res).userId, false);
    sendStatus(res, 204);
  })
);

export default profileRouter;
