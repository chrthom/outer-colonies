import express from 'express';
import cors from 'cors';
import config from 'config';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { matchMakingSocketListeners, matchMakingCron } from './components/matchmaking';
import { gameSocketListeners } from './components/game';
import { MsgTypeInbound } from './components/config/enums';
import restAPI from './components/rest_api';
import process from 'node:process';

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

restAPI(app);

httpServer.listen(config.get<number>('server.port'), () => {
    console.log(`Server started on stage ${config.get('stage')}`);
});

process.on('uncaughtException', (err) => {
    if (err.name == 'SqlError' && err.message.includes('socket has unexpectedly been closed'))
        console.log(`WARN: Caught exception: ${err}`);
});