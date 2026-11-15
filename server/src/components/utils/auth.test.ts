import { DailyType } from '../../shared/config/enums';
import DBConnection from '../persistence/db_connector';
import DBCredentialsDAO from '../persistence/db_credentials';
import DBDailiesDAO from '../persistence/db_dailies';
import DBDecksDAO from '../persistence/db_decks';
import DBMagicLinksDAO from '../persistence/db_magic_links';
import DBProfilesDAO from '../persistence/db_profiles';
import CardCollection from '../cards/collection/card_collection';
import Mailer from './mailer';
import AuthUtils from './auth';

describe('AuthUtils', () => {
  const registrationData = {
    username: 'testuser',
    password: 'password',
    email: 'test@example.com',
    newsletter: true,
    starterDeck: 0
  };
  const credential = {
    userId: 42,
    username: 'testuser',
    email: 'test@example.com',
    sessionToken: null
  };
  let fakeConnection: any;

  const setupFakePool = () => {
    fakeConnection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined)
    };
    DBConnection.instance.pool = <any>{ getConnection: jest.fn().mockResolvedValue(fakeConnection) };
  };

  describe('login', () => {
    it('should call DBDailiesDAO.achieve with correct parameters for login', async () => {
      // Mock the achieve method
      const achieveSpy = jest.spyOn(DBDailiesDAO, 'achieve');
      achieveSpy.mockImplementation(jest.fn());

      // Mock other dependencies
      const mockCredential = {
        userId: 123,
        sessionToken: 'test-token',
        username: 'testuser',
        email: 'test@example.com'
      };

      // Mock the getByUsername method to return our mock credential
      jest.spyOn(DBCredentialsDAO, 'getByUsername').mockResolvedValue(mockCredential);
      jest.spyOn(DBCredentialsDAO, 'login').mockResolvedValue('test-token');

      // Call the login method
      const loginData = { username: 'testuser', password: 'password' };
      await AuthUtils.login(loginData);

      // Verify that achieve was called with the correct parameters
      expect(achieveSpy).toHaveBeenCalledWith(123, DailyType.Login);

      // Clean up
      achieveSpy.mockRestore();
    });
  });

  describe('register', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should run all registration statements inside a committed transaction', async () => {
      setupFakePool();
      jest.spyOn(DBCredentialsDAO, 'create').mockResolvedValue(undefined);
      jest.spyOn(DBCredentialsDAO, 'getByUsername').mockResolvedValue(credential);
      jest.spyOn(DBProfilesDAO, 'create').mockResolvedValue(undefined);
      jest.spyOn(DBDailiesDAO, 'create').mockResolvedValue(undefined);
      const deckCreateSpy = jest.spyOn(DBDecksDAO, 'create').mockResolvedValue(undefined);
      jest.spyOn(DBMagicLinksDAO, 'createAccountActivation').mockResolvedValue('activation-uuid');
      const mailSpy = jest.spyOn(Mailer, 'sendAccountActivation').mockImplementation(() => undefined);

      const result = await AuthUtils.register(registrationData);

      expect(result).toBe(credential);
      expect(fakeConnection.beginTransaction).toHaveBeenCalledTimes(1);
      expect(fakeConnection.commit).toHaveBeenCalledTimes(1);
      expect(fakeConnection.rollback).not.toHaveBeenCalled();
      expect(deckCreateSpy).toHaveBeenCalledTimes(CardCollection.starterDecks[0].length);
      deckCreateSpy.mock.calls.forEach(([, userId, inUse]) => {
        expect(userId).toBe(credential.userId);
        expect(inUse).toBe(true);
      });
      expect(mailSpy).toHaveBeenCalledWith(credential.email, credential.username, 'activation-uuid');
    });

    it('should roll back the transaction when a registration statement fails', async () => {
      setupFakePool();
      jest.spyOn(DBCredentialsDAO, 'create').mockResolvedValue(undefined);
      jest.spyOn(DBCredentialsDAO, 'getByUsername').mockResolvedValue(credential);
      jest.spyOn(DBProfilesDAO, 'create').mockRejectedValue(new Error('profile insert failed'));
      const deckCreateSpy = jest.spyOn(DBDecksDAO, 'create').mockResolvedValue(undefined);

      await expect(AuthUtils.register(registrationData)).rejects.toThrow('profile insert failed');

      expect(fakeConnection.commit).not.toHaveBeenCalled();
      expect(fakeConnection.rollback).toHaveBeenCalledTimes(1);
      expect(deckCreateSpy).not.toHaveBeenCalled();
    });
  });
});
