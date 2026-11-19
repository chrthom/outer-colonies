import config from 'config';

/** Log levels in ascending severity. */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_SEVERITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

/**
 * Leveled logger and the single place in the server allowed to write to the console.
 * Every line is emitted with a consistent `LEVEL:` prefix, so no caller has to build
 * `WARN:`/`ERROR:` strings itself. Messages below the active level are dropped:
 * `debug` is development-only, all other levels are always emitted.
 */
class Logger {
  private activeLevel?: LogLevel;

  /** Logs a verbose diagnostic message; dropped outside the development stage. */
  debug(message: string): void {
    this.log('debug', message);
  }

  /** Logs a normal operational event, e.g. server startup or client connections. */
  info(message: string): void {
    this.log('info', message);
  }

  /** Logs a recoverable problem, e.g. an invalid client request. */
  warn(message: string): void {
    this.log('warn', message);
  }

  /** Logs a failure that needs attention, e.g. a caught exception. */
  error(message: string): void {
    this.log('error', message);
  }

  private log(level: LogLevel, message: string): void {
    if (LEVEL_SEVERITY[level] < LEVEL_SEVERITY[this.getActiveLevel()]) return;
    const line = `${level.toUpperCase()}: ${message}`;
    // warn and error go to stderr so failures stay separable from operational logs
    if (level == 'warn' || level == 'error') console.error(line);
    else console.log(line);
  }

  private getActiveLevel(): LogLevel {
    // The stage never changes at runtime, so the threshold is resolved only once
    this.activeLevel ??= config.get<string>('stage') == 'development' ? 'debug' : 'info';
    return this.activeLevel;
  }
}

export const logger = new Logger();
