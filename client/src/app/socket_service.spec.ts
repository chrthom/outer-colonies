import { TestBed } from '@angular/core/testing';
import { MatchmakingStatus, MsgTypeInbound, MsgTypeOutbound, TurnPhase } from '@shared/config/enums';
import ClientGameParams from '@shared/interfaces/client_game_params';
import { emptyClientState } from '@shared/interfaces/client_state';
import { Socket } from 'socket.io-client';
import { SocketService } from './socket_service';

interface FakeSocket {
  on: jasmine.Spy;
  off: jasmine.Spy;
  emit: jasmine.Spy;
  disconnect: jasmine.Spy;
  io: {
    on: jasmine.Spy;
    off: jasmine.Spy;
    reconnection: jasmine.Spy;
  };
  trigger: (event: string, ...args: unknown[]) => void;
  triggerManager: (event: string, ...args: unknown[]) => void;
}

function makeFakeSocket(): FakeSocket {
  const listeners = new Map<string, (...args: unknown[]) => void>();
  const managerListeners = new Map<string, (...args: unknown[]) => void>();

  const socket: FakeSocket = {
    on: jasmine.createSpy('socket.on').and.callFake((event: string, cb: (...args: unknown[]) => void) => {
      listeners.set(event, cb);
      return socket;
    }),
    off: jasmine.createSpy('socket.off').and.callFake((event: string, cb?: (...args: unknown[]) => void) => {
      if (!cb || listeners.get(event) === cb) {
        listeners.delete(event);
      }
      return socket;
    }),
    emit: jasmine.createSpy('socket.emit'),
    disconnect: jasmine.createSpy('socket.disconnect'),
    io: {
      on: jasmine.createSpy('io.on').and.callFake((event: string, cb: (...args: unknown[]) => void) => {
        managerListeners.set(event, cb);
      }),
      off: jasmine.createSpy('io.off').and.callFake((event: string, cb?: (...args: unknown[]) => void) => {
        if (!cb || managerListeners.get(event) === cb) {
          managerListeners.delete(event);
        }
      }),
      reconnection: jasmine.createSpy('io.reconnection')
    },
    trigger: (event: string, ...args: unknown[]) => listeners.get(event)?.(...args),
    triggerManager: (event: string, ...args: unknown[]) => managerListeners.get(event)?.(...args)
  };
  return socket;
}

describe('SocketService', () => {
  let service: SocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SocketService);
  });

  afterEach(() => {
    service.disconnect();
  });

  it('throws in getSocket() and returns false for hasSocket() when no connection was opened', () => {
    expect(service.hasSocket()).toBeFalse();
    expect(() => service.getSocket()).toThrow();
  });

  it('returns the socket opened by connect()', () => {
    const socket = makeFakeSocket();
    spyOn(service as unknown as { createSocket: () => Socket }, 'createSocket').and.returnValue(
      socket as unknown as Socket
    );

    expect(service.connect()).toBe(socket as unknown as Socket);
    expect(service.hasSocket()).toBeTrue();
    expect(service.getSocket()).toBe(socket as unknown as Socket);
  });

  it('disconnects and unregisters listeners of the previous session when opening a new one', () => {
    const first = makeFakeSocket();
    const second = makeFakeSocket();
    spyOn(service as unknown as { createSocket: () => Socket }, 'createSocket').and.returnValues(
      first as unknown as Socket,
      second as unknown as Socket
    );

    service.connect();
    service.connect();

    expect(first.off).toHaveBeenCalledWith(MsgTypeOutbound.Connect, jasmine.any(Function));
    expect(first.off).toHaveBeenCalledWith('disconnect', jasmine.any(Function));
    expect(first.off).toHaveBeenCalledWith('connect_error', jasmine.any(Function));
    expect(first.off).toHaveBeenCalledWith(MsgTypeOutbound.Matchmaking, jasmine.any(Function));
    expect(first.off).toHaveBeenCalledWith(MsgTypeOutbound.OnlineCount, jasmine.any(Function));
    expect(first.off).toHaveBeenCalledWith(MsgTypeOutbound.State, jasmine.any(Function));
    expect(first.off).toHaveBeenCalledWith(MsgTypeOutbound.Countdown, jasmine.any(Function));
    expect(first.io.off).toHaveBeenCalledWith('reconnect_failed', jasmine.any(Function));
    expect(first.disconnect).toHaveBeenCalled();
    expect(second.disconnect).not.toHaveBeenCalled();
    expect(service.getSocket()).toBe(second as unknown as Socket);
  });

  it('disconnects, removes listeners, and clears the current connection in disconnect()', () => {
    const socket = makeFakeSocket();
    spyOn(service as unknown as { createSocket: () => Socket }, 'createSocket').and.returnValue(
      socket as unknown as Socket
    );
    service.connect();

    service.disconnect();

    expect(socket.off).toHaveBeenCalledTimes(7);
    expect(socket.io.off).toHaveBeenCalledWith('reconnect_failed', jasmine.any(Function));
    expect(socket.disconnect).toHaveBeenCalled();
    expect(service.hasSocket()).toBeFalse();
    expect(() => service.getSocket()).toThrow();
  });

  it('tolerates disconnect() without an open connection', () => {
    expect(() => service.disconnect()).not.toThrow();
  });

  it('disables auto-reconnection on the active socket', () => {
    const socket = makeFakeSocket();
    spyOn(service as unknown as { createSocket: () => Socket }, 'createSocket').and.returnValue(
      socket as unknown as Socket
    );
    service.connect();

    service.disableReconnection();

    expect(socket.io.reconnection).toHaveBeenCalledWith(false);
  });

  it('forwards inbound socket events to typed RxJS streams', () => {
    const socket = makeFakeSocket();
    spyOn(service as unknown as { createSocket: () => Socket }, 'createSocket').and.returnValue(
      socket as unknown as Socket
    );
    service.connect();

    const events: string[] = [];
    let matchmakingPayload: unknown;
    let onlineCount: number | undefined;
    let receivedState: unknown;
    let countdownEvent: unknown;

    const sub = service.connect$.subscribe(() => events.push('connect'));
    sub.add(service.disconnect$.subscribe(() => events.push('disconnect')));
    sub.add(service.connectError$.subscribe(() => events.push('connect_error')));
    sub.add(service.reconnectFailed$.subscribe(() => events.push('reconnect_failed')));
    sub.add(service.matchmaking$.subscribe(ev => (matchmakingPayload = ev)));
    sub.add(service.onlineCount$.subscribe(count => (onlineCount = count)));
    sub.add(service.state$.subscribe(state => (receivedState = state)));
    sub.add(service.countdown$.subscribe(ev => (countdownEvent = ev)));

    const gameParams: ClientGameParams = { preloadCardIds: [1, 2] };
    socket.trigger(MsgTypeOutbound.Connect);
    socket.trigger('disconnect');
    socket.trigger('connect_error');
    socket.triggerManager('reconnect_failed');
    socket.trigger(MsgTypeOutbound.Matchmaking, MatchmakingStatus.Start, gameParams);
    socket.trigger(MsgTypeOutbound.OnlineCount, 9);
    socket.trigger(MsgTypeOutbound.State, emptyClientState);
    socket.trigger(MsgTypeOutbound.Countdown, 42, true);

    expect(events).toEqual(['connect', 'disconnect', 'connect_error', 'reconnect_failed']);
    expect(matchmakingPayload).toEqual({ status: MatchmakingStatus.Start, payload: gameParams });
    expect(onlineCount).toBe(9);
    expect(receivedState).toBe(emptyClientState);
    expect(countdownEvent).toEqual({ countdown: 42, isPlayerActive: true });

    sub.unsubscribe();
  });

  it('emits typed outbound messages on the active socket', () => {
    const socket = makeFakeSocket();
    spyOn(service as unknown as { createSocket: () => Socket }, 'createSocket').and.returnValue(
      socket as unknown as Socket
    );
    service.connect();

    service.emitLogin('tok-123');
    service.emitReady(TurnPhase.Init);
    service.emitReady(TurnPhase.Build, ['ship-1']);
    service.emitHandcard('hand-1', 'stack-1');
    service.emitHandcard('hand-2', 'stack-2', [10, 20]);
    service.emitDiscard('hand-3');
    service.emitAttack('stack-1', 'weapon-1', 'target-1');
    service.emitRetract('stack-1', 'card-1');
    service.emitSurrender();

    expect(socket.emit.calls.allArgs()).toEqual([
      [MsgTypeInbound.Login, 'tok-123'],
      [MsgTypeInbound.Ready, TurnPhase.Init],
      [MsgTypeInbound.Ready, TurnPhase.Build, ['ship-1']],
      [MsgTypeInbound.Handcard, 'hand-1', 'stack-1'],
      [MsgTypeInbound.Handcard, 'hand-2', 'stack-2', [10, 20]],
      [MsgTypeInbound.Discard, 'hand-3'],
      [MsgTypeInbound.Attack, 'stack-1', 'weapon-1', 'target-1'],
      [MsgTypeInbound.Retract, 'stack-1', 'card-1'],
      [MsgTypeInbound.Surrender]
    ]);
  });

  it('disconnects on ngOnDestroy()', () => {
    const socket = makeFakeSocket();
    spyOn(service as unknown as { createSocket: () => Socket }, 'createSocket').and.returnValue(
      socket as unknown as Socket
    );
    service.connect();

    service.ngOnDestroy();

    expect(socket.disconnect).toHaveBeenCalled();
    expect(service.hasSocket()).toBeFalse();
  });
});
