import Matchmaking from './matchmaking';
import { MatchmakingStatus, MsgTypeInbound, MsgTypeOutbound } from '@shared/config/enums';
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
  onlineIndicator: { setCount: jasmine.Spy };
  status: { setText: jasmine.Spy };
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
      MsgTypeOutbound.Matchmaking,
      MsgTypeOutbound.OnlineCount
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
      MsgTypeOutbound.OnlineCount,
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

  it('forwards the pushed online count to the online indicator', () => {
    const setCount = jasmine.createSpy('onlineIndicator.setCount');
    (matchmaking as unknown as MatchmakingOverrides).onlineIndicator = { setCount };

    const onlineCountHandler = socket.on.calls
      .allArgs()
      .find(args => args[0] == MsgTypeOutbound.OnlineCount)![1];
    onlineCountHandler(7);

    expect(setCount).toHaveBeenCalledWith(7);
  });

  it('emits StartBotGame and updates status when starting a bot game', () => {
    const setText = jasmine.createSpy('status.setText');
    (matchmaking as unknown as MatchmakingOverrides).status = { setText };

    matchmaking.startBotGame();

    expect(setText).toHaveBeenCalledWith('Starte Bot-Spiel...');
    expect(socket.emit).toHaveBeenCalledWith(MsgTypeInbound.StartBotGame);
  });

  it('updates status when a bot game request is rejected', () => {
    const setText = jasmine.createSpy('status.setText');
    (matchmaking as unknown as MatchmakingOverrides).status = { setText };

    const matchmakingHandler = socket.on.calls
      .allArgs()
      .find(args => args[0] == MsgTypeOutbound.Matchmaking)![1];
    matchmakingHandler(MatchmakingStatus.BotRejected);

    expect(setText).toHaveBeenCalledWith('Bot-Spiel konnte nicht gestartet werden. Suche Mitspieler...');
  });
});
