import ContinueButton from './continue_button';
import { animationConfig } from '../../config/animation';
import { BattleType, MsgTypeInbound, TurnPhase, Zone } from '@shared/config/enums';
import { ClientCardStack, ClientState, emptyClientState } from '@shared/interfaces/client_state';
import { asGameScene, makeSceneStub, SceneStub, TimeStub } from '../../testing/phaser_stubs';

/** A timer event queued by the queue-tracking time double. */
interface QueuedTimer {
  delay: number;
  callback: () => void;
  timerEvent: object;
  removed: boolean;
  fired: boolean;
}

/**
 * Test double for the scene clock (like the `FakeClock` in game.spec.ts):
 * records delayed calls so the spec can query, cancel and fire the auto-ready
 * timers, which makes ContinueButton's auto-ready logic testable without
 * Phaser timers.
 */
type QueuedTimeStub = TimeStub & { timers: QueuedTimer[] };

/** Creates a queue-tracking time double conforming to the shared `TimeStub`. */
function makeQueuedTimeStub(): QueuedTimeStub {
  const timers: QueuedTimer[] = [];
  return {
    timers,
    delayedCall: jasmine.createSpy('delayedCall').and.callFake((delay: number, callback: () => void) => {
      const timerEvent = {};
      timers.push({ delay, callback, timerEvent, removed: false, fired: false });
      return timerEvent;
    }),
    removeEvent: jasmine.createSpy('removeEvent').and.callFake((timerEvent: object) => {
      timers.filter(t => t.timerEvent == timerEvent).forEach(t => (t.removed = true));
    })
  };
}

/** Game scene stub from the shared harness with the queue-tracking time double. */
type ContinueButtonScene = SceneStub & { time: QueuedTimeStub };

/** Creates a game scene stub from the shared harness for the given state. */
function makeScene(state: ClientState): ContinueButtonScene {
  return makeSceneStub({ state, time: makeQueuedTimeStub() }) as ContinueButtonScene;
}

function makeCardStack(uuid: string, over: Partial<ClientCardStack> = {}): ClientCardStack {
  return {
    uuid: uuid,
    zone: Zone.Colony,
    cards: [],
    index: 0,
    zoneCardsNum: 1,
    ownedByPlayer: true,
    missionReady: false,
    interceptionReady: false,
    attributes: [],
    ...over
  };
}

/** Combat phase state in which the player is pending but cannot attack. */
function combatState(over: Partial<ClientState> = {}): ClientState {
  return {
    ...emptyClientState,
    playerPendingAction: true,
    playerIsActive: false,
    turnPhase: TurnPhase.Combat,
    battle: {
      type: BattleType.Raid,
      playerShipIds: [],
      opponentShipIds: ['opponent-ship'],
      range: 2
    },
    ...over
  };
}

/** Build phase state in which the inactive player is pending but cannot intercept. */
function buildState(over: Partial<ClientState> = {}): ClientState {
  return {
    ...emptyClientState,
    playerPendingAction: true,
    playerIsActive: false,
    turnPhase: TurnPhase.Build,
    ...over
  };
}

/** Not yet dispatched auto-ready timers queued for the given animation delay. */
const queuedAutoReadys = (scene: ContinueButtonScene, delay: number): QueuedTimer[] =>
  scene.time.timers.filter(t => !t.removed && !t.fired && t.delay == delay);

/** Fires all not yet dispatched timers queued for the given animation delay. */
const fireAutoReadys = (scene: ContinueButtonScene, delay: number) =>
  queuedAutoReadys(scene, delay).forEach(t => {
    t.fired = true;
    t.callback();
  });

describe('ContinueButton auto-ready', () => {
  it('queues no auto-ready while the player is not pending for an action', () => {
    const scene = makeScene({ ...emptyClientState, playerPendingAction: false });
    const button = new ContinueButton(asGameScene(scene));

    button.update();
    button.update();

    expect(queuedAutoReadys(scene, animationConfig.duration.attack).length).toBe(0);
    expect(queuedAutoReadys(scene, animationConfig.duration.move).length).toBe(0);
    expect(scene.socket.emit).not.toHaveBeenCalled();
  });

  describe('combat phase without battle-ready cards', () => {
    it('queues exactly one auto-ready despite repeated update() calls', () => {
      const scene = makeScene(combatState());
      const button = new ContinueButton(asGameScene(scene));

      button.update();
      button.update();
      button.update();

      expect(queuedAutoReadys(scene, animationConfig.duration.attack).length).toBe(1);
    });

    it('emits Ready exactly once per state, even after the emission was dispatched', () => {
      const scene = makeScene(combatState());
      const button = new ContinueButton(asGameScene(scene));

      button.update();
      fireAutoReadys(scene, animationConfig.duration.attack);

      expect(scene.socket.emit).toHaveBeenCalledWith(MsgTypeInbound.Ready, TurnPhase.Combat);
      expect(scene.socket.emit.calls.count()).toBe(1);

      // Repeated update() calls with the same state must not re-queue the emission
      button.update();
      button.update();
      fireAutoReadys(scene, animationConfig.duration.attack);

      expect(scene.socket.emit.calls.count()).toBe(1);
    });

    it('queues a new auto-ready for a new state, so the player advances once per pending action', () => {
      const scene = makeScene(combatState());
      const button = new ContinueButton(asGameScene(scene));

      button.update();
      fireAutoReadys(scene, animationConfig.duration.attack);

      // Server responds with a new state in which the player is pending again
      scene.state = combatState();
      button.update();
      button.update();
      fireAutoReadys(scene, animationConfig.duration.attack);

      expect(scene.socket.emit.calls.count()).toBe(2);
    });

    it('cancels a queued auto-ready once the player can attack again', () => {
      const scene = makeScene(combatState());
      const button = new ContinueButton(asGameScene(scene));

      button.update();
      expect(queuedAutoReadys(scene, animationConfig.duration.attack).length).toBe(1);

      // New state with a battle-ready card on one of the player's ships
      scene.state = combatState({
        cardStacks: [
          makeCardStack('player-ship', {
            cards: [
              {
                uuid: 'player-ship-weapon',
                id: 1,
                index: 0,
                battleReady: true,
                retractable: false,
                insufficientEnergy: false
              }
            ]
          })
        ],
        battle: {
          type: BattleType.Raid,
          playerShipIds: ['player-ship'],
          opponentShipIds: ['opponent-ship'],
          range: 2
        }
      });
      button.update();

      expect(queuedAutoReadys(scene, animationConfig.duration.attack).length).toBe(0);
      expect(scene.time.removeEvent).toHaveBeenCalled();
      expect(scene.socket.emit).not.toHaveBeenCalled();
    });

    it('does not queue an auto-ready while the player can attack', () => {
      const scene = makeScene(
        combatState({
          cardStacks: [
            makeCardStack('player-ship', {
              cards: [
                {
                  uuid: 'player-ship-weapon',
                  id: 1,
                  index: 0,
                  battleReady: true,
                  retractable: false,
                  insufficientEnergy: false
                }
              ]
            })
          ],
          battle: {
            type: BattleType.Raid,
            playerShipIds: ['player-ship'],
            opponentShipIds: ['opponent-ship'],
            range: 2
          }
        })
      );
      const button = new ContinueButton(asGameScene(scene));

      button.update();
      button.update();

      expect(queuedAutoReadys(scene, animationConfig.duration.attack).length).toBe(0);
      expect(scene.socket.emit).not.toHaveBeenCalled();
    });

    it('cancels the queued auto-ready when the player acts himself', () => {
      const scene = makeScene(combatState());
      const button = new ContinueButton(asGameScene(scene));

      button.update();
      expect(queuedAutoReadys(scene, animationConfig.duration.attack).length).toBe(1);

      (button as unknown as { onClickAction: () => void }).onClickAction(); // Manual click on the continue button

      expect(queuedAutoReadys(scene, animationConfig.duration.attack).length).toBe(0);
      expect(scene.socket.emit).toHaveBeenCalledWith(MsgTypeInbound.Ready, TurnPhase.Combat);
      expect(scene.socket.emit.calls.count()).toBe(1);
    });

    it('does not re-queue an auto-ready after a manual click for the same state', () => {
      const scene = makeScene(combatState());
      const button = new ContinueButton(asGameScene(scene));

      button.update();
      (button as unknown as { onClickAction: () => void }).onClickAction(); // Manual click on the continue button
      expect(scene.socket.emit.calls.count()).toBe(1);

      // User interactions while waiting for the server trigger further update() calls
      button.update();
      button.update();

      expect(queuedAutoReadys(scene, animationConfig.duration.attack).length).toBe(0);
      fireAutoReadys(scene, animationConfig.duration.attack);
      expect(scene.socket.emit.calls.count()).toBe(1); // No second Ready for the same pending action

      // A new state (e.g. after a rejected Ready) still queues a new auto-ready
      scene.state = combatState();
      button.update();
      expect(queuedAutoReadys(scene, animationConfig.duration.attack).length).toBe(1);
      fireAutoReadys(scene, animationConfig.duration.attack);
      expect(scene.socket.emit.calls.count()).toBe(2);
    });
  });

  describe('build phase without interception-ready ships', () => {
    it('queues exactly one auto-ready and skips with an empty ship list', () => {
      const scene = makeScene(buildState());
      const button = new ContinueButton(asGameScene(scene));

      button.update();
      button.update();
      button.update();

      const queued = queuedAutoReadys(scene, animationConfig.duration.move);
      expect(queued.length).toBe(1);
      queued[0].callback();

      expect(scene.socket.emit).toHaveBeenCalledWith(MsgTypeInbound.Ready, TurnPhase.Build, []);
      expect(scene.socket.emit.calls.count()).toBe(1);
    });

    it('queues no auto-ready while the player can intercept', () => {
      const scene = makeScene(
        buildState({ cardStacks: [makeCardStack('interceptor', { interceptionReady: true })] })
      );
      const button = new ContinueButton(asGameScene(scene));

      button.update();
      button.update();

      expect(queuedAutoReadys(scene, animationConfig.duration.move).length).toBe(0);
      expect(scene.socket.emit).not.toHaveBeenCalled();
    });

    it('queues no auto-ready for the active player', () => {
      const scene = makeScene(buildState({ playerIsActive: true }));
      const button = new ContinueButton(asGameScene(scene));

      button.update();
      button.update();

      expect(queuedAutoReadys(scene, animationConfig.duration.move).length).toBe(0);
      expect(scene.socket.emit).not.toHaveBeenCalled();
    });
  });
});
