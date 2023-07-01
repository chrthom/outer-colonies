import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { matchMakingSocketListeners, matchMakingCron } from './components/matchmaking';
import { gameSocketListeners } from './components/game';
import { MsgTypeInbound } from './components/config/enums';
import Auth from './components/utils/auth';
import { ExistsResponse, LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from './components/api/rest_api';

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

io.on(MsgTypeInbound.Connect, (socket) => {
    console.log(`Client connected: ${socket.id}`);
    socket.on(MsgTypeInbound.Disconnect, () => {
        console.log(`Client disconnected: ${socket.id}`);
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
    Auth.register(<RegisterRequest> req.body).then(success => {
        const payload: RegisterResponse = {
            success: success
        };
        res.send(payload);
    });
});

app.post('/api/auth/login', (req, res) => {
    Auth.login(<LoginRequest> req.body).then(sessionToken => {
        const payload: LoginResponse = {
            success: sessionToken != null,
            sessionToken: sessionToken
        };
        res.send(payload);
    })
});

app.get('/api/auth/exists', (req, res) => {
    const sendExistsResponse = (exists: boolean) => {
        const payload: ExistsResponse = {
            exists: exists
        };
        res.send(payload);
    }
    if (req.query.username) Auth.checkUsernameExists(String(req.query.username)).then(sendExistsResponse);
    else if (req.query.email) Auth.checkEmailExists(String(req.query.email)).then(sendExistsResponse);
    else res.sendStatus(400);
});

httpServer.listen(3000, () => {
    console.log('Server started!');
});
