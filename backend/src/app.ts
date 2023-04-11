import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { matchMakingSocketListeners, matchMakingCron } from './components/matchmaking';
import { gameSocketListeners } from './components/game';

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

io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
    });
    matchMakingSocketListeners(io, socket);
    gameSocketListeners(io, socket);
});

setInterval(matchMakingCron, 3000, io);

app.get('/cardimages/*', (req, res) => {
    const file = req.path.replace('/cardimages/', '');
    fetch(`https://thomsen.in/outercolonies/${file}`).then(actual => actual.body.pipe(res));
});

httpServer.listen(3000, () => {
    console.log('Server started!');
});