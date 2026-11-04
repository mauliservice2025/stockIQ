import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { authRepository } from './auth.repository.js';
import { LoginInput, AuthResponse } from './auth.schema.js';
import { UnauthorizedError } from '../../common/errors/app-error.js';
import { env } from '../../config/env.config.js';

export class AuthService {
  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await authRepository.findByUsernameOrEmail(input.username);

    if (!user) {
      // In development fallback if user is admin / admin123 and database is being initialized
      if (env.NODE_ENV === 'development' && input.username === 'admin' && input.password === 'admin123') {
        const signOptions: SignOptions = {
          expiresIn: '8h'
        };
        const token = jwt.sign(
          {
            id: 'USR-ADMIN-DEV',
            username: 'admin',
            email: 'admin@stockiq.local',
            roles: ['SUPER_ADMIN', 'Admin'],
            permissions: ['*'],
            plantId: 'PLANT-01'
          },
          env.JWT_SECRET,
          signOptions
        );

        return {
          token,
          user: {
            id: 'USR-ADMIN-DEV',
            username: 'admin',
            email: 'admin@stockiq.local',
            firstName: 'Super',
            lastName: 'Admin',
            roles: ['SUPER_ADMIN', 'Admin'],
            permissions: ['*'],
            plantId: 'PLANT-01',
            plantName: 'Main Plant & Workshop'
          }
        };
      }

      throw new UnauthorizedError('Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError('User account is inactive or suspended');
    }

    const isMatch = await bcrypt.compare(input.password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const { roles, permissions } = await authRepository.getUserRolesAndPermissions(user.id);
    const plant = await authRepository.getDefaultPlant(user.id);

    const tokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      roles,
      permissions,
      plantId: plant?.id || 'PLANT-01'
    };

    const signOptions: SignOptions = {
      expiresIn: '8h'
    };

    const token = jwt.sign(tokenPayload, env.JWT_SECRET, signOptions);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        roles,
        permissions,
        plantId: plant?.id || 'PLANT-01',
        plantName: plant?.name || 'Main Plant & Workshop'
      }
    };
  }
}

export const authService = new AuthService();
