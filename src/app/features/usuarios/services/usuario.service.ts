import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  ApiResponse,
  UserResponse,
  UserRequest,
  UserUpdateRequest,
  UpdateStatusRequest,
  AssignRolesRequest,
  RoleResponse
} from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/users`;
  private readonly rolesUrl = `${environment.apiBaseUrl}/roles`;

  getUsers(): Observable<UserResponse[]> {
    return this.http.get<ApiResponse<UserResponse[]>>(this.apiUrl).pipe(
      map(response => response.data)
    );
  }

  getUserById(id: number): Observable<UserResponse> {
    return this.http.get<ApiResponse<UserResponse>>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  createUser(request: UserRequest): Observable<UserResponse> {
    return this.http.post<ApiResponse<UserResponse>>(this.apiUrl, request).pipe(
      map(response => response.data)
    );
  }

  updateUser(id: number, request: UserUpdateRequest): Observable<UserResponse> {
    return this.http.put<ApiResponse<UserResponse>>(`${this.apiUrl}/${id}`, request).pipe(
      map(response => response.data)
    );
  }

  updateStatus(id: number, enabled: boolean): Observable<UserResponse> {
    const request: UpdateStatusRequest = { enabled };
    return this.http.patch<ApiResponse<UserResponse>>(`${this.apiUrl}/${id}/status`, request).pipe(
      map(response => response.data)
    );
  }

  getRoles(): Observable<RoleResponse[]> {
    return this.http.get<ApiResponse<RoleResponse[]>>(this.rolesUrl).pipe(
      map(response => response.data)
    );
  }

  getUserRoles(id: number): Observable<RoleResponse[]> {
    return this.http.get<ApiResponse<RoleResponse[]>>(`${this.apiUrl}/${id}/roles`).pipe(
      map(response => response.data)
    );
  }

  assignRoles(id: number, roleIds: number[]): Observable<UserResponse> {
    const request: AssignRolesRequest = { roleIds };
    return this.http.put<ApiResponse<UserResponse>>(`${this.apiUrl}/${id}/roles`, request).pipe(
      map(response => response.data)
    );
  }
}
