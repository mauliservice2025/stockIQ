import { query } from '../../database/client.js';

export interface UserRecord {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  status: string;
}

export class AuthRepository {
  async findByUsernameOrEmail(identifier: string): Promise<UserRecord | null> {
    const res = await query<UserRecord>(
      `SELECT id, username, email, password_hash, first_name, last_name, status
       FROM users
       WHERE (username = $1 OR email = $1) AND deleted_at IS NULL
       LIMIT 1;`,
      [identifier]
    );
    return res.rows[0] || null;
  }

  async getUserRolesAndPermissions(userId: string): Promise<{ roles: string[]; permissions: string[] }> {
    const rolesRes = await query<{ role_name: string }>(
      `SELECT r.name as role_name
       FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1;`,
      [userId]
    );

    const permsRes = await query<{ code: string }>(
      `SELECT DISTINCT p.code
       FROM user_roles ur
       JOIN role_permissions rp ON ur.role_id = rp.role_id
       JOIN permissions p ON rp.permission_id = p.id
       WHERE ur.user_id = $1;`,
      [userId]
    );

    return {
      roles: rolesRes.rows.map(r => r.role_name),
      permissions: permsRes.rows.map(p => p.code)
    };
  }

  async getDefaultPlant(userId: string): Promise<{ id: string; name: string } | null> {
    const res = await query<{ id: string; name: string }>(
      `SELECT p.id, p.name
       FROM user_plants up
       JOIN plants p ON up.plant_id = p.id
       WHERE up.user_id = $1
       LIMIT 1;`,
      [userId]
    );
    return res.rows[0] || null;
  }
}

export const authRepository = new AuthRepository();
