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

  it('shows a timeout message with a retry affordance when the server ends the search', () => {
    const setText = jasmine.createSpy('status.setText');
    const enableRetry = jasmine.createSpy('status.enableRetry');
    const exitButtonUpdate = jasmine.createSpy('exitButton.update');
    (
      matchmaking as unknown as {
        status: { setText: typeof setText; enableRetry: typeof enableRetry };
        exitButton: { update: typeof exitButtonUpdate };
      }
    ).status = { setText, enableRetry };
    (matchmaking as unknown as { exitButton: { update: typeof exitButtonUpdate } }).exitButton = {
      update: exitButtonUpdate
    };

    const matchmakingHandler = socket.on.calls
      .allArgs()
      .find(args => args[0] == MsgTypeOutbound.Matchmaking)![1];
    matchmakingHandler(MatchmakingStatus.Timeout);

    expect(setText.calls.mostRecent().args[0]).toContain('Keine Mitspieler');
    expect(enableRetry).toHaveBeenCalled();
    expect(matchmaking.searchEnded).toBeTrue();
    expect(exitButtonUpdate).toHaveBeenCalled();
  });

  it('re-emits the login when the player retries the search after the timeout', () => {
    const enableRetry = jasmine.createSpy('status.enableRetry');
    (
      matchmaking as unknown as {
        status: { setText: jasmine.Spy; enableRetry: typeof enableRetry };
        exitButton: { update: jasmine.Spy };
      }
    ).status = { setText: jasmine.createSpy('status.setText'), enableRetry };
    (matchmaking as unknown as { exitButton: { update: jasmine.Spy } }).exitButton = {
      update: jasmine.createSpy('exitButton.update')
    };
    (matchmaking as unknown as { sessionToken: string }).sessionToken = 'test-token';

    const matchmakingHandler = socket.on.calls
      .allArgs()
      .find(args => args[0] == MsgTypeOutbound.Matchmaking)![1];
    matchmakingHandler(MatchmakingStatus.Timeout);
    const retryAction = enableRetry.calls.mostRecent().args[0] as () => void;
    retryAction();

    expect(socket.emit).toHaveBeenCalledWith(MsgTypeInbound.Login, 'test-token');
  });

  it('resets the ended search when the server restarts it', () => {
    const setText = jasmine.createSpy('status.setText');
    const exitButtonUpdate = jasmine.createSpy('exitButton.update');
    (matchmaking as unknown as { status: { setText: typeof setText } }).status = { setText };
    (matchmaking as unknown as { exitButton: { update: typeof exitButtonUpdate } }).exitButton = {
      update: exitButtonUpdate
    };
    matchmaking.searchEnded = true;

    const matchmakingHandler = socket.on.calls
      .allArgs()
      .find(args => args[0] == MsgTypeOutbound.Matchmaking)![1];
    matchmakingHandler(MatchmakingStatus.Search, 0);

    expect(matchmaking.searchEnded).toBeFalse();
    expect(exitButtonUpdate).toHaveBeenCalled();
    expect(setText.calls.mostRecent().args[0]).toContain('Suche Mitspieler');
  });
});
