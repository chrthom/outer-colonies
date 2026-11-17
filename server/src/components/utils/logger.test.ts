import { logger } from './logger';

describe('logger', () => {
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  test('emits info messages on stdout with an INFO prefix', () => {
    logger.info('server started');

    expect(logSpy).toHaveBeenCalledWith('INFO: server started');
    expect(errorSpy).not.toHaveBeenCalled();
  });

  test('emits warn messages on stderr with a WARN prefix', () => {
    logger.warn('invalid request');

    expect(errorSpy).toHaveBeenCalledWith('WARN: invalid request');
    expect(logSpy).not.toHaveBeenCalled();
  });

  test('emits error messages on stderr with an ERROR prefix', () => {
    logger.error('caught exception');

    expect(errorSpy).toHaveBeenCalledWith('ERROR: caught exception');
    expect(logSpy).not.toHaveBeenCalled();
  });

  test('drops debug messages outside the development stage', () => {
    // The jest stage is 'test', so verbose debug output is filtered
    logger.debug('verbose detail');

    expect(logSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
