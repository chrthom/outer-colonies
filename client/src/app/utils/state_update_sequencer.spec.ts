import StateUpdateSequencer from './state_update_sequencer';

/**
 * Test double for the injected scheduler: records scheduled timers so tests
 * can fire them manually instead of relying on Phaser's clock.
 */
class FakeScheduler {
  readonly scheduled: Array<{ delay: number; callback: () => void }> = [];

  schedule = (delay: number, callback: () => void) => {
    this.scheduled.push({ delay, callback });
  };

  /** Fires and removes the oldest scheduled timer (mimics an elapsed timer). */
  fireOldest() {
    const entry = this.scheduled.shift();
    if (!entry) throw new Error('No timer scheduled');
    entry.callback();
  }
}

describe('StateUpdateSequencer', () => {
  let scheduler: FakeScheduler;
  let sequencer: StateUpdateSequencer;

  beforeEach(() => {
    scheduler = new FakeScheduler();
    sequencer = new StateUpdateSequencer(scheduler.schedule);
  });

  it('does not run any step synchronously', () => {
    const calls: string[] = [];
    sequencer.run([{ delay: () => 0, action: () => calls.push('step') }]);
    expect(calls).toEqual([]);
    expect(scheduler.scheduled.length).toBe(1);
  });

  it('runs the steps sequentially in the given order with their delays', () => {
    const calls: string[] = [];
    sequencer.run([
      { delay: () => 100, action: () => calls.push('one') },
      { delay: () => 200, action: () => calls.push('two') },
      { delay: () => 0, action: () => calls.push('three') }
    ]);
    expect(scheduler.scheduled[0].delay).toBe(100);
    scheduler.fireOldest();
    expect(calls).toEqual(['one']);
    expect(scheduler.scheduled[0].delay).toBe(200);
    scheduler.fireOldest();
    expect(calls).toEqual(['one', 'two']);
    scheduler.fireOldest();
    expect(calls).toEqual(['one', 'two', 'three']);
    expect(scheduler.scheduled).toEqual([]);
  });

  it('evaluates a delay only after the previous step ran', () => {
    let sideEffect = false;
    const observed: boolean[] = [];
    sequencer.run([
      { delay: () => 0, action: () => (sideEffect = true) },
      {
        delay: () => {
          observed.push(sideEffect);
          return 0;
        },
        action: () => {}
      }
    ]);
    expect(observed).toEqual([]); // Not evaluated when the run starts
    scheduler.fireOldest();
    expect(observed).toEqual([true]); // Step 2's delay saw step 1's side effect
  });

  it('does not schedule anything for an empty step list', () => {
    sequencer.run([]);
    expect(scheduler.scheduled).toEqual([]);
  });

  it('lets the newest run execute all of its steps', () => {
    const calls: string[] = [];
    sequencer.run([{ delay: () => 0, action: () => calls.push('old') }]);
    sequencer.run([
      { delay: () => 0, action: () => calls.push('new-1') },
      { delay: () => 0, action: () => calls.push('new-2') }
    ]);
    while (scheduler.scheduled.length) scheduler.fireOldest();
    expect(calls).toEqual(['new-1', 'new-2']);
  });

  it('cancels pending steps of a previous run when a newer run starts', () => {
    const calls: string[] = [];
    sequencer.run([
      { delay: () => 0, action: () => calls.push('old-1') },
      { delay: () => 0, action: () => calls.push('old-2') }
    ]);
    scheduler.fireOldest(); // old-1 executed, old-2 still queued
    sequencer.run([{ delay: () => 0, action: () => calls.push('new-1') }]);
    while (scheduler.scheduled.length) scheduler.fireOldest();
    expect(calls).toEqual(['old-1', 'new-1']);
  });

  it('skips a superseded run whose timer fires only after a newer run started', () => {
    const calls: string[] = [];
    sequencer.run([{ delay: () => 0, action: () => calls.push('old') }]);
    sequencer.run([{ delay: () => 0, action: () => calls.push('new') }]);
    scheduler.fireOldest(); // Stale callback of the superseded run
    scheduler.fireOldest(); // Callback of the newest run
    expect(calls).toEqual(['new']);
  });
});
