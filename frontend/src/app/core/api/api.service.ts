import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, AuthResponse, Facility, HealthStatus, LoginRequest, User } from './models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = '/api/v1';

  public getHealth(): Observable<HealthStatus> {
    return this.http.get<HealthStatus>(`${this.baseUrl}/health`);
  }

  public login(credentials: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.baseUrl}/auth/login`, credentials);
  }

  public getFacilities(): Observable<ApiResponse<Facility[]>> {
    return this.http.get<ApiResponse<Facility[]>>(`${this.baseUrl}/facilities`);
  }

  public getUsers(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(`${this.baseUrl}/users`);
  }

  public createUser(payload: Partial<User> & { password: string }): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.baseUrl}/users`, payload);
  }
}
