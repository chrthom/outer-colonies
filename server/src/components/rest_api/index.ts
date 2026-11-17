import { Express } from 'express';
import { Readable } from 'node:stream';
import config from 'config';
import { logger } from '../utils/logger';
import authRouter from './auth_router';
import deckRouter from './deck_router';
import profileRouter from './profile_router';
import dailyRouter from './daily_router';
import itemRouter from './item_router';
import shopRouter from './shop_router';
import { apiErrorHandler } from './api_error';

/**
 * Mounts the REST API on the given express application: the assets proxy (forwarding to the
 * asset server to by-pass CORS issues), one router per resource and the central error-handling
 * middleware.
 * @param app express application to mount the REST API on
 */
export default function restAPI(app: Express) {
  // Forward to assets to by-pass CORS issues
  app.get('/assets/*', (req, res) => {
    const file = req.path.replace('/assets/', '');
    fetch(`${config.get('url.assets')}/${file}`)
      .then(async actual => {
        // An upstream error body would otherwise be piped to the client with an implicit 200
        if (!actual.ok) {
          logger.warn(
            `Assets request for ${file} failed with upstream status ${actual.status}, responding with 502`
          );
          // An unconsumed body would keep the underlying socket out of the keep-alive pool
          await actual.body?.cancel();
          res.status(502).end();
          return;
        }
        if (!actual.body) {
          logger.warn(`Assets response for ${file} has no body, responding with 502`);
          res.status(502).end();
          return;
        }
        // The global fetch returns a web stream; the express response expects a node stream
        const stream = Readable.fromWeb(actual.body);
        // pipe returns the destination, so the upstream failure handler must sit on the source
        stream.on('error', err => {
          logger.warn(`Assets stream for ${file} failed: ${err}, responding with 502`);
          res.status(502).end();
        });
        stream.pipe(res);
      })
      .catch(err => {
        logger.warn(`Fetching asset ${file} failed: ${err}, responding with 502`);
        res.status(502).end();
      });
  });

  app.use(authRouter);
  app.use(deckRouter);
  app.use(profileRouter);
  app.use(dailyRouter);
  app.use(itemRouter);
  app.use(shopRouter);
  app.use(apiErrorHandler);
}
