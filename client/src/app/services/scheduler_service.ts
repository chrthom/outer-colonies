import { Injectable } from '@angular/core';

/**
 * Browser-timer scheduler service so game sequencing and auto-ready timers run
 * without Phaser clocks and can be replaced cleanly in Angular TestBed specs.
 */
@Injectable({ providedIn: 'root' })
export class SchedulerService {
  /**
   * Schedules a callback to execute after `delayMs` milliseconds and returns a
   * cancellation handle.
   *
   * @param delayMs Delay in milliseconds before invoking `callback`.
   * @param callback Callback to execute once the delay elapses.
   */
  schedule(delayMs: number, callback: () => void): () => void {
    const timerId = globalThis.setTimeout(callback, delayMs);
    return () => globalThis.clearTimeout(timerId);
  }
}
