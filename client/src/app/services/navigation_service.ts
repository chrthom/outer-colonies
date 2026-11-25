import { Injectable } from '@angular/core';

/**
 * Wraps browser external navigation so Angular components can redirect cleanly
 * and unit tests can intercept navigation without reloading the test runner.
 */
@Injectable({ providedIn: 'root' })
export class NavigationService {
  /** Navigates the current browser tab to the given URL. */
  navigateTo(url: string): void {
    window.location.href = url;
  }
}
