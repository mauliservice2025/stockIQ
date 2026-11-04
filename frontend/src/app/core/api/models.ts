export interface HealthStatus {
  status: 'healthy' | 'degraded';
  uptimeSeconds: number;
  version: string;
  timestamp: string;
  database: {
    connected: boolean;
    latencyMs: number;
    error?: string;
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  roles?: string[];
  permissions?: string[];
  plantId?: string;
  plantName?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Facility {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  organization_id?: string;
  address?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
    timestamp: string;
  };
}

