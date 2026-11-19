import { isValidEmail } from './email_rules';

describe('isValidEmail', () => {
  it.each([
    'user@example.com',
    'a%b@example.com',
    'a!b@example.com',
    'a#$%&*+/=?^_`{|}~-b@example.com',
    'a\x27b@example.com',
    'user.name+tag@example.com',
    'user@localhost'
  ])('accepts %s', email => {
    expect(isValidEmail(email)).toBe(true);
  });

  it.each([
    '',
    'not-an-email',
    '.user@example.com',
    'user..name@example.com',
    'user.@example.com',
    'user@-example.com',
    'user@example-.com',
    'user@example..com',
    'user name@example.com',
    ' user@example.com '
  ])('rejects %s', email => {
    expect(isValidEmail(email)).toBe(false);
  });
});
