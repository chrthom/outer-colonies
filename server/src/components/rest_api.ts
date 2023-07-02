import { Express } from 'express';
import fetch from 'node-fetch';
import Auth from './utils/auth';
import { AuthExistsResponse, AuthLoginRequest, AuthLoginResponse, AuthRegisterRequest, AuthRegisterResponse, DeckCard, DeckListResponse } from './shared_interfaces/rest_api';
import DBDecksDAO, { DBDeck } from './persistence/db_decks';
import DBCredentialsDAO from './persistence/db_credentials';

export default function restAPI(app: Express) {
    app.get('/cardimages/*', (req, res) => {
        const file = req.path.replace('/cardimages/', '');
        fetch(`https://thomsen.in/outercolonies/${file}`).then(actual => actual.body.pipe(res));
    });

    app.post('/api/auth/register', (req, res) => {
        Auth.register(<AuthRegisterRequest> req.body).then(success => {
            const payload: AuthRegisterResponse = {
                success: success
            };
            res.send(payload);
        });
    });
    
    app.post('/api/auth/login', (req, res) => {
        Auth.login(<AuthLoginRequest> req.body).then(sessionToken => {
            const payload: AuthLoginResponse = {
                success: sessionToken != null,
                sessionToken: sessionToken
            };
            res.send(payload);
        })
    });
    
    app.get('/api/auth/exists', (req, res) => {
        const sendExistsResponse = (exists: boolean) => {
            const payload: AuthExistsResponse = {
                exists: exists
            };
            res.send(payload);
        }
        if (req.query.username) Auth.checkUsernameExists(String(req.query.username)).then(sendExistsResponse);
        else if (req.query.email) Auth.checkEmailExists(String(req.query.email)).then(sendExistsResponse);
        else res.sendStatus(400);
    });

    app.get('/api/deck', (req, res) => {
        const sendDeckResponse = (cards: DBDeck[]) => {
            const payload: DeckListResponse = {
                activeCards: cards.filter(c => c.inUse).map(c => <DeckCard> c),
                reserveCards: cards.filter(c => !c.inUse).map(c => <DeckCard> c)
            };
            res.send(payload);
        }
        const sessionToken = req.header('session-token');
        if (sessionToken) {
            DBCredentialsDAO.getBySessionToken(sessionToken).then(u => {
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
}