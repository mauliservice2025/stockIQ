import { Router } from 'express';
import { loginController } from './auth.controller.js';
import { validate } from '../../common/middleware/validate.middleware.js';
import { LoginSchema } from './auth.schema.js';

export const authRouter = Router();

authRouter.post('/login', validate({ body: LoginSchema }), loginController);

