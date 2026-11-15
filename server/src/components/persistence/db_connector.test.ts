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
  });

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
    it('should use and end a pooled connection', async () => {
      const execute = jest.fn().mockResolvedValue([]);
      fakeConnection.prepare.mockResolvedValue({ execute });

      await db.query('SELECT 1', []);

      expect((db.pool as any).getConnection).toHaveBeenCalledTimes(1);
      expect(fakeConnection.prepare).toHaveBeenCalledWith('SELECT 1');
      expect(execute).toHaveBeenCalledWith([]);
      expect(fakeConnection.end).toHaveBeenCalled();
    });
  });
});
