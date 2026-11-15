/**
 * A single step of a state update sequence.
 */
export interface StateUpdateStep {
  /**
   * Delay in milliseconds to wait before this step runs. Evaluated after the
   * previous step has finished, so a step can base its delay on side effects
   * of earlier steps (e.g. whether a retract animation was started).
   */
  delay: () => number;
  /** Side effect to apply when this step runs. */
  action: () => void;
}

/**
 * Cancel-and-replace sequencer for the client state update pipeline.
 *
 * Each `run()` call captures a fresh version token and thereby supersedes
 * every step of previous runs that has not started yet: the newest state
 * wins and no stale animation step executes after its state was replaced.
 * Steps that already ran stay applied; the next run reconciles the remaining
 * delta between the current UI and the newest state.
 *
 * The scheduler is injected, so sequences are unit-testable without Phaser
 * timers.
 */
export default class StateUpdateSequencer {
  private version = 0;

  constructor(private schedule: (delayMs: number, callback: () => void) => void) {}

  /**
   * Runs the given steps sequentially: each step waits for `delay()` ms after
   * its predecessor before its `action()` executes. Starting a new run
   * cancels all not yet started steps of the previous run.
   *
   * @param steps Steps to execute in order; may be empty.
   */
  run(steps: StateUpdateStep[]) {
    const version = ++this.version;
    const runNext = (index: number) => {
      const step = steps[index];
      if (!step || version != this.version) return; // Run was superseded by a newer one
      this.schedule(step.delay(), () => {
        if (version != this.version) return; // Run was superseded while waiting
        step.action();
        runNext(index + 1);
      });
    };
    runNext(0);
  }
}
