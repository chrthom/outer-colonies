import { Express } from 'express';
import fetch from 'node-fetch';
import Auth from './utils/auth';
import { AuthExistsResponse, AuthLoginRequest, AuthLoginResponse, AuthRegisterRequest, AuthRegisterResponse, DeckCard, DeckListResponse } from './shared_interfaces/rest_api';
import DBDecksDAO, { DBDeck } from './persistence/db_decks';
import DBCredentialsDAO from './persistence/db_credentials';
import CardCollection from './cards/collection/card_collection';
import Card from './cards/card';

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
        const toDeckCard = (c: DBDeck) => {
            const cardData: Card = CardCollection.cards[c.cardId];
            return {
                id: c.cardInstanceId,
                cardId: c.cardId,
                name: cardData.name,
                rarity: cardData.rarity,
                type: cardData.type,
                inUse: c.inUse
            }
        }
        const sendDeckResponse = (cards: DBDeck[]) => {
            const payload: DeckListResponse = {
                cards: cards.map(toDeckCard)
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

    app.post('/api/deck/:cardInstanceId(\\d+)', (req, res) => {
        DBDecksDAO.setInUse(Number(req.params.cardInstanceId), true).then(_ => res.sendStatus(204));
    });

    app.delete('/api/deck/:cardInstanceId(\\d+)', (req, res) => {
        DBDecksDAO.setInUse(Number(req.params.cardInstanceId), false).then(_ => res.sendStatus(204));
    });
}