import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { matchMakingSocketListeners, matchMakingCron } from './components/scenes/matchmaking';
import { gameSocketListeners } from './components/scenes/game';
import { MsgTypeInbound } from './components/config/enums';
import DBConnection from './components/utils/db_connector';

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

app.post('/api/register', (req, res) => {
    console.log(`Registration request: ${Object.keys(req)} | ${JSON.stringify(req.body)}`); ////
    res.send({ foo: 'bar' }); ////
});

httpServer.listen(3000, () => {
    console.log('Server started!');
});

const dbConnection = DBConnection.getInstance(); // Just a test
dbConnection.query('SELECT * FROM credentials').then(v => console.log(v)); // TODO: Remove
