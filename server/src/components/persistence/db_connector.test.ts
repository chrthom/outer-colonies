import DBConnection from './db_connector';

describe('DBConnection', () => {
  let db: DBConnection;
  let fakeConnection: any;

  beforeEach(() => {
    fakeConnection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      end: jest.fn().mockResolvedValue(undefined),
      prepare: jest.fn().mockResolvedValue({ execute: jest.fn().mockResolvedValue([]) })
    };
    db = DBConnection.instance;
    db.pool = <any>{ getConnection: jest.fn().mockResolvedValue(fakeConnection) };
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function mockConnection(prepare: jest.Mock) {
    return {
      prepare,
      release: jest.fn().mockResolvedValue(undefined),
      end: jest.fn().mockResolvedValue(undefined)
    };
  }

  function mockPool(getConnection: jest.Mock) {
    db.pool = { getConnection } as any;
    return getConnection;
  }

  describe('transaction', () => {
    it('should commit and release the connection when the callback resolves', async () => {
      const result = await db.transaction(async () => 'result');

      expect(result).toBe('result');
      expect(fakeConnection.beginTransaction).toHaveBeenCalledTimes(1);
      expect(fakeConnection.commit).toHaveBeenCalledTimes(1);
      expect(fakeConnection.rollback).not.toHaveBeenCalled();
      expect(fakeConnection.release).toHaveBeenCalledTimes(1);
    });

    it('should roll back, release the connection and rethrow when the callback rejects', async () => {
      const error = new Error('insert failed');

      await expect(db.transaction(async () => Promise.reject(error))).rejects.toThrow('insert failed');

      expect(fakeConnection.beginTransaction).toHaveBeenCalledTimes(1);
      expect(fakeConnection.commit).not.toHaveBeenCalled();
      expect(fakeConnection.rollback).toHaveBeenCalledTimes(1);
      expect(fakeConnection.release).toHaveBeenCalledTimes(1);
    });

    it('should roll back when the commit itself fails', async () => {
      fakeConnection.commit.mockRejectedValue(new Error('commit failed'));

      await expect(db.transaction(async () => Promise.resolve())).rejects.toThrow('commit failed');

      expect(fakeConnection.rollback).toHaveBeenCalledTimes(1);
      expect(fakeConnection.release).toHaveBeenCalledTimes(1);
    });

    it('should execute queries of the callback on the transaction connection', async () => {
      const execute = jest.fn().mockResolvedValue([{ user_id: 1 }]);
      fakeConnection.prepare.mockResolvedValue({ execute });

      await db.transaction(async () => {
        await db.query('SELECT user_id FROM credentials WHERE user_id = ?', [1]);
      });

      expect(fakeConnection.prepare).toHaveBeenCalledWith(
        'SELECT user_id FROM credentials WHERE user_id = ?'
      );
      expect(execute).toHaveBeenCalledWith([1]);
      expect((db.pool as any).getConnection).toHaveBeenCalledTimes(1);
    });

    it('should not retry failed statements inside a transaction', async () => {
      fakeConnection.prepare.mockRejectedValue(new Error('syntax error'));

      await expect(db.transaction(async () => db.query('INVALID SYNTAX', []))).rejects.toThrow(
        'syntax error'
      );

      expect(fakeConnection.rollback).toHaveBeenCalledTimes(1);
      expect((db.pool as any).getConnection).toHaveBeenCalledTimes(1);
    });

    it('should join an already running transaction instead of opening a nested one', async () => {
      const innerResult = await db.transaction(async () => db.transaction(async () => 'inner'));

      expect(innerResult).toBe('inner');
      expect((db.pool as any).getConnection).toHaveBeenCalledTimes(1);
      expect(fakeConnection.beginTransaction).toHaveBeenCalledTimes(1);
      expect(fakeConnection.commit).toHaveBeenCalledTimes(1);
    });
  });

  describe('query outside a transaction', () => {
    it('should execute the query and release the connection back to the pool', async () => {
      const execute = jest.fn().mockResolvedValue([{ id: 1 }]);
      const close = jest.fn();
      const conn = mockConnection(jest.fn().mockResolvedValue({ execute, close }));
      const getConnection = mockPool(jest.fn().mockResolvedValue(conn));

      const result = await db.query('SELECT id FROM t WHERE id = ?', [1]);

      expect(result).toEqual([{ id: 1 }]);
      expect(getConnection).toHaveBeenCalledTimes(1);
      expect(conn.prepare).toHaveBeenCalledWith('SELECT id FROM t WHERE id = ?');
      expect(execute).toHaveBeenCalledWith([1]);
      expect(close).toHaveBeenCalledTimes(1);
      expect(conn.release).toHaveBeenCalledTimes(1);
      expect(conn.end).not.toHaveBeenCalled();
    });

    it('should not release the connection before the query has finished', async () => {
      let resolveExecute: (value: any) => void = () => undefined;
      const executePromise = new Promise<any>(resolve => (resolveExecute = resolve));
      const conn = mockConnection(
        jest.fn().mockResolvedValue({ execute: jest.fn().mockReturnValue(executePromise), close: jest.fn() })
      );
      mockPool(jest.fn().mockResolvedValue(conn));

      const queryPromise = db.query('SELECT 1', []);
      await new Promise(resolve => setImmediate(resolve));

      expect(conn.release).not.toHaveBeenCalled();
      resolveExecute([]);
      await expect(queryPromise).resolves.toEqual([]);
      expect(conn.release).toHaveBeenCalledTimes(1);
    });

    it('should retry connection acquisition and succeed when a connection becomes available', async () => {
      const conn = mockConnection(
        jest.fn().mockResolvedValue({ execute: jest.fn().mockResolvedValue([]), close: jest.fn() })
      );
      const getConnection = mockPool(
        jest
          .fn()
          .mockRejectedValueOnce(new Error('ER_GET_CONNECTION_TIMEOUT'))
          .mockRejectedValueOnce(new Error('ER_GET_CONNECTION_TIMEOUT'))
          .mockResolvedValue(conn)
      );

      await expect(db.query('SELECT 1', [])).resolves.toEqual([]);
      expect(getConnection).toHaveBeenCalledTimes(3);
      expect(conn.release).toHaveBeenCalledTimes(1);
    });

    it('should give up after a bounded number of acquisition attempts', async () => {
      const getConnection = mockPool(jest.fn().mockRejectedValue(new Error('ER_GET_CONNECTION_TIMEOUT')));

      await expect(db.query('SELECT 1', [])).rejects.toThrow('ER_GET_CONNECTION_TIMEOUT');
      expect(getConnection).toHaveBeenCalledTimes(3);
    });

    it('should not retry when executing the statement fails', async () => {
      const execute = jest.fn().mockRejectedValue(new Error('ER_DUP_ENTRY'));
      const conn = mockConnection(jest.fn().mockResolvedValue({ execute, close: jest.fn() }));
      const getConnection = mockPool(jest.fn().mockResolvedValue(conn));

      await expect(db.query('INSERT INTO t VALUES (?)', [1])).rejects.toThrow('ER_DUP_ENTRY');
      expect(getConnection).toHaveBeenCalledTimes(1);
      expect(execute).toHaveBeenCalledTimes(1);
      expect(conn.release).toHaveBeenCalledTimes(1);
    });

    it('should not retry when preparing the statement fails', async () => {
      const conn = mockConnection(jest.fn().mockRejectedValue(new Error('ER_PARSE_ERROR')));
      const getConnection = mockPool(jest.fn().mockResolvedValue(conn));

      await expect(db.query('SELECT ???', [])).rejects.toThrow('ER_PARSE_ERROR');
      expect(getConnection).toHaveBeenCalledTimes(1);
      expect(conn.prepare).toHaveBeenCalledTimes(1);
      expect(conn.release).toHaveBeenCalledTimes(1);
    });
  });
});
