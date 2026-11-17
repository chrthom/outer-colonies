import { Express } from 'express';
import fetch from 'node-fetch';
import config from 'config';
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

  app.use(authRouter);
  app.use(deckRouter);
  app.use(profileRouter);
  app.use(dailyRouter);
  app.use(itemRouter);
  app.use(shopRouter);
  app.use(apiErrorHandler);
}
