import Matchmaking from './matchmaking';
import { MsgTypeOutbound } from '@shared/config/enums';
import ClientGameParams from '@shared/interfaces/client_game_params';
import Phaser from 'phaser';

/** Fake socket that records the listeners registered and removed by the scene. */
interface SocketListenerStub {
  on: jasmine.Spy;
  off: jasmine.Spy;
  emit: jasmine.Spy;
  io: { on: jasmine.Spy; off: jasmine.Spy };
}

/** Handle for overriding private internals of a Matchmaking instance in tests. */
interface MatchmakingOverrides {
  socket: SocketListenerStub;
  events: { once: jasmine.Spy };
  registerSocketListeners: () => void;
  scene: { start: jasmine.Spy };
}

describe('Matchmaking scene - socket listener lifecycle', () => {
  let matchmaking: Matchmaking;
  let socket: SocketListenerStub;
  let shutdownEvent: string;
  let shutdownHandler: () => void;

  beforeEach(() => {
    matchmaking = new Matchmaking();
    socket = jasmine.createSpyObj('Socket', ['on', 'off', 'emit']);
    socket.io = jasmine.createSpyObj('Manager', ['on', 'off']);
    const handle = matchmaking as unknown as MatchmakingOverrides;
    handle.socket = socket;
    handle.events = {
      once: jasmine.createSpy('events.once').and.callFake((event: string, handler: () => void) => {
        shutdownEvent = event;
        shutdownHandler = handler;
      })
    };
    handle.registerSocketListeners();
  });

  it('registers all matchmaking listeners in create()', () => {
    expect(socket.on.calls.allArgs().map(args => args[0])).toEqual([
      MsgTypeOutbound.Connect,
      'disconnect',
      'connect_error',
      MsgTypeOutbound.Matchmaking
    ]);
    expect(socket.io.on.calls.allArgs().map(args => args[0])).toEqual(['reconnect_failed']);
  });

  it('binds the listener cleanup to the scene shutdown event', () => {
    expect(shutdownEvent).toBe(Phaser.Scenes.Events.SHUTDOWN);
  });

  it('removes all matchmaking listeners on scene shutdown', () => {
    shutdownHandler();

    expect(socket.off.calls.allArgs().map(args => args[0])).toEqual([
      MsgTypeOutbound.Connect,
      MsgTypeOutbound.Matchmaking,
      'disconnect',
      'connect_error'
    ]);
    expect(socket.io.off.calls.allArgs().map(args => args[0])).toEqual(['reconnect_failed']);
  });

  it('starts the game scene without passing the socket through the scene data', () => {
    const gameParams: ClientGameParams = { preloadCardIds: [1, 2, 3] };
    const start = jasmine.createSpy('scene.start');
    (matchmaking as unknown as MatchmakingOverrides).scene = { start };

    const matchmakingHandler = socket.on.calls
      .allArgs()
      .find(args => args[0] == MsgTypeOutbound.Matchmaking)![1];
    matchmakingHandler('start', gameParams);

    expect(start).toHaveBeenCalledWith('Game', { gameParams });
  });
});
