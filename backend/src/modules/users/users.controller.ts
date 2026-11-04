import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service.js';
import { CreateUserInput } from './users.schema.js';

export async function getUsersController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const users = await usersService.getAllUsers();
    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
}

export async function createUserController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await usersService.createUser(req.body as CreateUserInput);
    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
}
