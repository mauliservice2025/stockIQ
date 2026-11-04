import { Router } from 'express';
import { getUsersController, createUserController } from './users.controller.js';
import { validate } from '../../common/middleware/validate.middleware.js';
import { CreateUserSchema } from './users.schema.js';
import { authenticate, authorize } from '../../common/middleware/auth.middleware.js';

export const usersRouter = Router();

usersRouter.get('/', authenticate, getUsersController);
usersRouter.post('/', authenticate, authorize('USERS_MANAGE'), validate({ body: CreateUserSchema }), createUserController);

