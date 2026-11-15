import DBConnection from './db_connector';

describe('DBConnection', () => {
  let db: DBConnection;

  beforeEach(() => {
    db = DBConnection.instance;
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
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

  describe('query', () => {
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
