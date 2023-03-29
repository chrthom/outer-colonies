const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['PUT', 'GET', 'POST', 'DELETE', 'OPTIONS'],
        headers: '*',
        credentials: false
    }
});

const { matchMakingSocketListeners, matchMakingCron } = require('./components/matchmaking');

io.on('connection', (socket) => {
    console.log('Player connected: ' + socket.id);
    socket.on('disconnect', () => {
        console.log('Player disconnected: ' + socket.id);
    });
    matchMakingSocketListeners(io, socket);
});

setInterval(matchMakingCron, 3000, io);

httpServer.listen(3000, () => {
    console.log('Server started!');
});