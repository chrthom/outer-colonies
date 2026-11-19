import { Router } from 'express';
import { OnlineGetResponse } from '../../shared/interfaces/rest_api';
import { onlineUserCount } from '../online_users';

const onlineRouter = Router();

// Deliberately unauthenticated: the count is public and polled by the website home page
onlineRouter.get('/api/online', (req, res) => {
  const payload: OnlineGetResponse = { count: onlineUserCount() };
  res.status(200).send(payload);
});

export default onlineRouter;
