import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { matchMakingSocketListeners, matchMakingCron } from './components/scenes/matchmaking';
import { gameSocketListeners } from './components/scenes/game';
import { MsgTypeInbound } from './components/config/enums';
import DBConnection from './components/utils/db_connector';
import Auth from './components/utils/auth';
import { ExistsResponse, RegisterRequest, RegisterResponse } from './components/utils/api';

const app = express();
app.use(cors());
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['PUT', 'GET', 'POST', 'DELETE', 'OPTIONS'],
        credentials: false
    }
});
const auth = new Auth(DBConnection.getInstance());

io.on(MsgTypeInbound.Connect, (socket) => {
    console.log(`Player connected: ${socket.id}`);
    socket.on(MsgTypeInbound.Disconnect, () => {
        console.log(`Player disconnected: ${socket.id}`);
    });
    matchMakingSocketListeners(io, socket);
    gameSocketListeners(io, socket);
});

setInterval(matchMakingCron, 1000, io);

app.use(express.json());

app.get('/cardimages/*', (req, res) => {
    const file = req.path.replace('/cardimages/', '');
    fetch(`https://thomsen.in/outercolonies/${file}`).then(actual => actual.body.pipe(res));
});

app.post('/api/auth/register', (req, res) => {
    auth.register(<RegisterRequest>req.body).then(success => {
        const payload: RegisterResponse = {
            success: success
        };
        res.send(payload);
    });
});

app.get('/api/auth/exists', (req, res) => {
    const sendExistsResponse = (exists: boolean) => {
        const payload: ExistsResponse = {
            exists: exists
        };
        res.send(payload);
    }
    if (req.query.username) auth.checkUsernameExists(String(req.query.username)).then(sendExistsResponse);
    else if (req.query.email) auth.checkEmailExists(String(req.query.email)).then(sendExistsResponse);
    else res.sendStatus(400);
});

httpServer.listen(3000, () => {
    console.log('Server started!');
});
