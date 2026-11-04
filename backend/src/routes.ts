import { Router } from 'express';
import { healthRouter } from './modules/health/health.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { facilitiesRouter } from './modules/facilities/facilities.routes.js';
import { usersRouter } from './modules/users/users.routes.js';

export const apiRouter = Router();

apiRouter.use('/', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/facilities', facilitiesRouter);
apiRouter.use('/users', usersRouter);
