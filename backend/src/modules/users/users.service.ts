import bcrypt from 'bcryptjs';
import { usersRepository } from './users.repository.js';
import { CreateUserInput, UserItem } from './users.schema.js';

export class UsersService {
  async getAllUsers(): Promise<UserItem[]> {
    return usersRepository.getAll();
  }

  async createUser(input: CreateUserInput): Promise<UserItem> {
    const passwordHash = await bcrypt.hash(input.password, 10);
    return usersRepository.create(input, passwordHash);
  }
}

export const usersService = new UsersService();

