import { Router } from 'express';
import Auth from '../utils/auth';
import DBCredentialsDAO from '../persistence/db_credentials';
import {
  AuthEmailRequest,
  AuthExistsResponse,
  AuthLoginRequest,
  AuthLoginResponse,
  AuthPasswordRequest,
  AuthRegisterRequest,
  AuthRegistrationResponse
} from '../../shared/interfaces/rest_api';
import { APIRejectReason } from '../../shared/config/enums';
import { ApiError, asyncRoute, RejectMapping } from './api_error';
import { sendStatus } from './api_response';
import { validatedParam } from '../utils/request_validation';
import { requireSession, sessionCredentials } from './session_middleware';

/** Reject mapping for endpoints whose underlying operation fails when the record is unknown. */
const notFound: RejectMapping = {
  [APIRejectReason.NotFound]: [404]
};

const authRouter = Router();

authRouter.post(
  '/api/auth/register',
  asyncRoute(async (req, res) => {
    const registerRequest = <AuthRegisterRequest>req.body;
    if (await Auth.checkUsernameExists(registerRequest.username)) {
      throw new ApiError(409, 'Username already exists');
    }
    if (await Auth.checkEmailExists(registerRequest.email)) {
      throw new ApiError(409, 'Email already exists');
    }
    const credential = await Auth.register(registerRequest);
    const payload: AuthRegistrationResponse = {
      id: credential.userId,
      username: credential.username
    };
    res.status(201).send(payload);
  })
);

authRouter.put(
  '/api/auth/register/:id',
  asyncRoute(async (req, res) => {
    await Auth.activateAccount(validatedParam(req, res, 'id'));
    sendStatus(res, 204);
  }, notFound)
);

authRouter.post(
  '/api/auth/login',
  asyncRoute(
    async (req, res) => {
      const u = await Auth.login(<AuthLoginRequest>req.body);
      const payload: AuthLoginResponse = {
        sessionToken: u.sessionToken,
        username: u.username,
        email: u.email
      };
      res.status(200).send(payload);
    },
    {
      [APIRejectReason.NotFound]: [401]
    }
  )
);

authRouter.get(
  '/api/auth/login',
  requireSession,
  asyncRoute(async (req, res) => {
    const u = sessionCredentials(res);
    const payload: AuthLoginResponse = {
      sessionToken: u.sessionToken,
      username: u.username,
      email: u.email
    };
    res.status(200).send(payload);
  })
);

authRouter.delete(
  '/api/auth/login',
  requireSession,
  asyncRoute(async (req, res) => {
    await Auth.logout(sessionCredentials(res).sessionToken);
    sendStatus(res, 204);
  })
);

authRouter.get(
  '/api/auth/exists',
  asyncRoute(async (req, res) => {
    const sendExistsResponse = (exists: boolean) => {
      const payload: AuthExistsResponse = {
        exists: exists
      };
      res.status(200).send(payload);
    };
    if (req.query['username']) {
      await Auth.checkUsernameExists(String(req.query['username'])).then(sendExistsResponse);
    } else if (req.query['email']) {
      await Auth.checkEmailExists(String(req.query['email'])).then(sendExistsResponse);
    } else {
      throw new ApiError(400, 'No username or email parameter was provided');
    }
  })
);

authRouter.delete(
  '/api/auth/password/:user',
  asyncRoute(async (req, res) => {
    await Auth.sendPasswordReset(validatedParam(req, res, 'user'));
    sendStatus(res, 202);
  }, notFound)
);

authRouter.put(
  '/api/auth/password',
  requireSession,
  asyncRoute(async (req, res) => {
    await DBCredentialsDAO.setPassword(
      sessionCredentials(res).userId,
      (<AuthPasswordRequest>req.body).password
    );
    sendStatus(res, 204);
  }, notFound)
);

authRouter.put(
  '/api/auth/password/:id',
  asyncRoute(async (req, res) => {
    await Auth.resetPassword(validatedParam(req, res, 'id'), (<AuthPasswordRequest>req.body).password);
    sendStatus(res, 204);
  }, notFound)
);

authRouter.post(
  '/api/auth/email',
  requireSession,
  asyncRoute(async (req, res) => {
    const u = sessionCredentials(res);
    await Auth.sendEmailConfirmation(u.userId, u.username, (<AuthEmailRequest>req.body).email);
    sendStatus(res, 202);
  })
);

authRouter.put(
  '/api/auth/email/:id',
  asyncRoute(async (req, res) => {
    await Auth.resetEmail(validatedParam(req, res, 'id'));
    sendStatus(res, 204);
  }, notFound)
);

export default authRouter;
