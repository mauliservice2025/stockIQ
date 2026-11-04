import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import { LoginInput } from './auth.schema.js';

export async function loginController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.login(req.body as LoginInput);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}
