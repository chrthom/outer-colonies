import { DailyType } from '../../shared/config/enums';
import DBDailiesDAO from '../persistence/db_dailies';
import AuthUtils from './auth';

describe('AuthUtils', () => {
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
      import DBCredentialsDAO from '../persistence/db_credentials';
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
});
