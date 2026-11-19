// Matches the website's previous Angular email validator, retaining compatibility with
// addresses already accepted at registration without claiming full RFC 5322 support.
const emailPattern =
  /^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Checks the email format shared by the server and website. This is a practical subset of
 * email syntax, not a check that the address exists or can receive mail. Callers enforce
 * their own required and length constraints and any whitespace normalization.
 * @param email email address to check
 * @returns whether the address has an accepted format
 */
export function isValidEmail(email: string): boolean {
  return emailPattern.test(email);
}
