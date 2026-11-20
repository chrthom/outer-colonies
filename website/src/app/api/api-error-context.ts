import { HttpContextToken } from '@angular/common/http';

/** Skip automatic session clearing and login redirection for an explicitly handled request. */
export const SKIP_AUTH_ERROR_REDIRECT = new HttpContextToken<boolean>(() => false);
