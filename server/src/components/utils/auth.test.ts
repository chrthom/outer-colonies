import { APIRejectReason, DailyType } from '../../shared/config/enums';
import { AuthRegisterRequest } from '../../shared/interfaces/rest_api';
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
  const credential = {
    userId: 42,
    username: 'testuser',
    email: 'test@example.com',
    sessionToken: null
  };
  const mockCredential = {
    userId: 123,
    sessionToken: 'test-token',
    username: 'testuser',
    email: 'test@example.com'
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
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should call DBDailiesDAO.achieve with correct parameters for login', async () => {
      // Mock the achieve method
      const achieveSpy = jest.spyOn(DBDailiesDAO, 'achieve');
      achieveSpy.mockImplementation(jest.fn());

      // Mock other dependencies
      const mockLoginCredential = {
        userId: 123,
        sessionToken: 'test-token',
        username: 'testuser',
        email: 'test@example.com'
      };

      // Mock the getByUsername method to return our mock credential
      jest.spyOn(DBCredentialsDAO, 'getByUsername').mockResolvedValue(mockLoginCredential);
      jest.spyOn(DBCredentialsDAO, 'login').mockResolvedValue('test-token');

      // Call the login method
      const loginData = { username: 'testuser', password: 'password' };
      await AuthUtils.login(loginData);

      // Verify that achieve was called with the correct parameters
      expect(achieveSpy).toHaveBeenCalledWith(123, DailyType.Login);

      // Clean up
      achieveSpy.mockRestore();
    });

    it('should rethrow real errors from the credential lookup instead of masking them as NotFound', async () => {
      jest.spyOn(DBCredentialsDAO, 'getByUsername').mockRejectedValue(new Error('DB error'));

      await expect(AuthUtils.login({ username: 'testuser', password: 'password' })).rejects.toThrow(
        'DB error'
      );
    });
  });

  describe('checkUsernameExists', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should resolve to false when the username is unknown', async () => {
      jest.spyOn(DBCredentialsDAO, 'getByUsername').mockRejectedValue(APIRejectReason.NotFound);
      await expect(AuthUtils.checkUsernameExists('unknown')).resolves.toBe(false);
    });

    it('should rethrow real errors instead of rejecting with undefined', async () => {
      jest.spyOn(DBCredentialsDAO, 'getByUsername').mockRejectedValue(new Error('DB error'));
      await expect(AuthUtils.checkUsernameExists('testuser')).rejects.toThrow('DB error');
    });
  });

  describe('checkEmailExists', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should resolve to false when the email is unknown', async () => {
      jest.spyOn(DBCredentialsDAO, 'getByEmail').mockRejectedValue(APIRejectReason.NotFound);
      await expect(AuthUtils.checkEmailExists('unknown@example.com')).resolves.toBe(false);
    });

    it('should rethrow real errors instead of rejecting with undefined', async () => {
      jest.spyOn(DBCredentialsDAO, 'getByEmail').mockRejectedValue(new Error('DB error'));
      await expect(AuthUtils.checkEmailExists('test@example.com')).rejects.toThrow('DB error');
    });
  });

  describe('register', () => {
    const registrationData: AuthRegisterRequest = {
      username: 'testuser',
      password: 'password',
      email: 'test@example.com',
      starterDeck: 0,
      newsletter: false
    };

    beforeEach(() => {
      setupFakePool();
      jest.spyOn(DBCredentialsDAO, 'create').mockResolvedValue(undefined);
      jest.spyOn(DBCredentialsDAO, 'getByUsername').mockResolvedValue(mockCredential);
      jest.spyOn(DBProfilesDAO, 'create').mockResolvedValue(undefined);
      jest.spyOn(DBDailiesDAO, 'create').mockResolvedValue(undefined);
      jest.spyOn(DBDecksDAO, 'create').mockResolvedValue(undefined);
      jest.spyOn(DBMagicLinksDAO, 'createAccountActivation').mockResolvedValue('uuid-123');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should send the activation mail and return the credential on success', async () => {
      const sendMailSpy = jest.spyOn(Mailer, 'sendAccountActivation').mockResolvedValue({});
      const registeredCredential = await AuthUtils.register(registrationData);
      expect(sendMailSpy).toHaveBeenCalledWith('test@example.com', 'testuser', 'uuid-123');
      expect(registeredCredential).toEqual(mockCredential);
    });

    it('should reject if the activation mail cannot be sent', async () => {
      jest.spyOn(Mailer, 'sendAccountActivation').mockRejectedValue(new Error('SMTP error'));
      await expect(AuthUtils.register(registrationData)).rejects.toThrow('SMTP error');
    });

    it('should run all registration statements inside a committed transaction', async () => {
      setupFakePool();
      jest.spyOn(DBCredentialsDAO, 'create').mockResolvedValue(undefined);
      jest.spyOn(DBCredentialsDAO, 'getByUsername').mockResolvedValue(credential);
      jest.spyOn(DBProfilesDAO, 'create').mockResolvedValue(undefined);
      jest.spyOn(DBDailiesDAO, 'create').mockResolvedValue(undefined);
      const deckCreateSpy = jest.spyOn(DBDecksDAO, 'create').mockResolvedValue(undefined);
      jest.spyOn(DBMagicLinksDAO, 'createAccountActivation').mockResolvedValue('activation-uuid');
      const callOrder: string[] = [];
      fakeConnection.commit.mockImplementation(async () => {
        callOrder.push('commit');
      });
      const mailSpy = jest.spyOn(Mailer, 'sendAccountActivation').mockImplementation(async () => {
        callOrder.push('mail');
      });

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
      expect(callOrder).toEqual(['commit', 'mail']);
    });

    it('should roll back the transaction and send no activation mail when a registration statement fails', async () => {
      setupFakePool();
      jest.spyOn(DBCredentialsDAO, 'create').mockResolvedValue(undefined);
      jest.spyOn(DBCredentialsDAO, 'getByUsername').mockResolvedValue(credential);
      jest.spyOn(DBProfilesDAO, 'create').mockRejectedValue(new Error('profile insert failed'));
      const deckCreateSpy = jest.spyOn(DBDecksDAO, 'create').mockResolvedValue(undefined);
      const mailSpy = jest.spyOn(Mailer, 'sendAccountActivation').mockImplementation(async () => undefined);

      await expect(AuthUtils.register(registrationData)).rejects.toThrow('profile insert failed');

      expect(fakeConnection.commit).not.toHaveBeenCalled();
      expect(fakeConnection.rollback).toHaveBeenCalledTimes(1);
      expect(deckCreateSpy).not.toHaveBeenCalled();
      expect(mailSpy).not.toHaveBeenCalled();
    });
  });

  describe('sendPasswordReset', () => {
    beforeEach(() => {
      jest.spyOn(DBCredentialsDAO, 'getByUsername').mockResolvedValue(mockCredential);
      jest.spyOn(DBMagicLinksDAO, 'createPasswordReset').mockResolvedValue('uuid-123');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should send the password reset mail on success', async () => {
      const sendMailSpy = jest.spyOn(Mailer, 'sendPasswordReset').mockResolvedValue({});
      await AuthUtils.sendPasswordReset('testuser');
      expect(sendMailSpy).toHaveBeenCalledWith('test@example.com', 'testuser', 'uuid-123');
    });

    it('should reject if the password reset mail cannot be sent', async () => {
      jest.spyOn(Mailer, 'sendPasswordReset').mockRejectedValue(new Error('SMTP error'));
      await expect(AuthUtils.sendPasswordReset('testuser')).rejects.toThrow('SMTP error');
    });
  });

  describe('sendEmailConfirmation', () => {
    beforeEach(() => {
      jest.spyOn(DBMagicLinksDAO, 'createEmailConfirmation').mockResolvedValue('uuid-123');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should send the email confirmation mail on success', async () => {
      const sendMailSpy = jest.spyOn(Mailer, 'sendEmailConfirmation').mockResolvedValue({});
      await AuthUtils.sendEmailConfirmation(123, 'testuser', 'new@example.com');
      expect(sendMailSpy).toHaveBeenCalledWith('new@example.com', 'testuser', 'uuid-123');
    });

    it('should reject if the email confirmation mail cannot be sent', async () => {
      jest.spyOn(Mailer, 'sendEmailConfirmation').mockRejectedValue(new Error('SMTP error'));
      await expect(AuthUtils.sendEmailConfirmation(123, 'testuser', 'new@example.com')).rejects.toThrow(
        'SMTP error'
      );
    });
  });
});
