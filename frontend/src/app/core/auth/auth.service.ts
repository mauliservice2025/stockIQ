import { Injectable, signal } from '@angular/core';

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  primaryRole: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public currentUser = signal<AuthUser | null>({
    id: 'USR-001',
    username: 'p.patil',
    fullName: 'Pravin Patil',
    email: 'pravin.patil@apexenterprise.com',
    primaryRole: 'SUPER_ADMIN'
  });

  public isAuthenticated = signal<boolean>(true);

  public login(user: AuthUser): void {
    this.currentUser.set(user);
    this.isAuthenticated.set(true);
  }

  public logout(): void {
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }
}

