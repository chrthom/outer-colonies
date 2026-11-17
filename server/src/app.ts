import express from 'express';
import cors from 'cors';
import config from 'config';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { matchMakingSocketListeners, matchMakingCron } from './components/matchmaking';
import { gameCron, gameSocketListeners } from './components/game';
import { MsgTypeInbound } from './shared/config/enums';
import { version, releaseName } from './shared/config/version';
import authValidation from './components/rest_api/auth_validation';
import restAPI from './components/rest_api';
import DBConnection from './components/persistence/db_connector';
import { logger } from './components/utils/logger';
import process from 'node:process';

const app = express();
// The API is deployed behind a local reverse proxy that terminates HTTPS: the proxy enters
// the server container from the Docker bridge gateway, so the private bridge subnet must be
// trusted alongside loopback for req.ip to resolve to the real client address there (the
// rate limiters of the auth endpoints bucket per client). There is exactly one trusted
// proxy hop; direct LAN clients bypassing the proxy are not in the trusted set, so
// X-Forwarded-For spoofing stays impossible.
app.set('trust proxy', ['loopback', '172.16.0.0/12']);
app.use(cors());
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['PUT', 'GET', 'POST', 'DELETE', 'OPTIONS'],
    credentials: false
  }
});

io.on(MsgTypeInbound.Connect, socket => {
  logger.info(`Client connected: ${socket.id}`);
  socket.on(MsgTypeInbound.Disconnect, () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
  matchMakingSocketListeners(io, socket);
  gameSocketListeners(io, socket);
});

app.use(express.json());
// The validation and rate-limiting layer must sit in front of the API routers, so malformed
// requests are rejected with a 400 and unauthenticated endpoints are throttled before any
// route handler runs
app.use(authValidation);
restAPI(app);

/** Upper bound for the graceful shutdown before the process is exited forcefully. */
const SHUTDOWN_GRACE_PERIOD_MS = 10000;

let cronIntervals: NodeJS.Timeout[] = [];
let shuttingDown = false;

function startCrons() {
  cronIntervals.push(setInterval(matchMakingCron, 1000, io));
  cronIntervals.push(setInterval(gameCron, 1000, io));
}

/**
 * Tears down the server gracefully: clears the crons, disconnects all Socket.IO clients,
 * closes the HTTP server and the database pool, then exits the process. The teardown is
 * idempotent and force-exits after {@link SHUTDOWN_GRACE_PERIOD_MS} at the latest.
 * @param reason short description of what triggered the shutdown, used for the log line
 * @param exitCode process exit code to terminate with
 */
function shutdown(reason: string, exitCode: number) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`${reason}: shutting down server gracefully`);
  cronIntervals.forEach(clearInterval);
  cronIntervals = [];
  io.close();
  httpServer.close(() => {
    DBConnection.instance.pool
      .end()
      .catch(err => logger.warn(`Failed to close database pool during shutdown: ${err}`))
      .then(() => process.exit(exitCode));
  });
  // Safety net: exit even if a connection keeps the HTTP server from closing on its own
  setTimeout(() => process.exit(exitCode), SHUTDOWN_GRACE_PERIOD_MS).unref();
}

async function start() {
  try {
    // Probe the pool before accepting traffic: crons and socket listeners must not start
    // doing work while the database is not known to be reachable
    await DBConnection.instance.query('SELECT 1', []);
  } catch (err) {
    logger.error(`Database is not reachable at startup: ${err}`);
    process.exit(1);
  }
  httpServer.listen(config.get<number>('server.port'), () => {
    logger.info(`Server v${version} (${releaseName}) started on stage ${config.get('stage')}`);
    startCrons();
  });
  process.on('SIGTERM', () => shutdown('Received SIGTERM', 0));
  process.on('SIGINT', () => shutdown('Received SIGINT', 0));
  if (!config.get<boolean>('terminate_on_error')) {
    process.on('uncaughtException', err => {
      logger.error(`Caught exception: ${err.name} -> ${err.message}${err.stack ? '\n' + err.stack : ''}`);
      // A process that threw an uncaught exception may be corrupted: it must not keep serving
      // requests, so it terminates through the graceful shutdown instead of continuing
      shutdown(`Uncaught exception ${err.name}`, 1);
    });
  }
}

void start();
