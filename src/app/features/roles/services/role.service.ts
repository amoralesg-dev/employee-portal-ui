import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  ApiResponse,
  RoleResponse,
  RoleRequest,
  PermissionResponse,
  AssignPermissionsRequest
} from '../models/role.model';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/roles`;
  private readonly permissionsUrl = `${environment.apiBaseUrl}/permissions`;

  getRoles(): Observable<RoleResponse[]> {
    return this.http.get<ApiResponse<RoleResponse[]>>(this.apiUrl).pipe(
      map(response => response.data)
    );
  }

  getRoleById(id: number): Observable<RoleResponse> {
    return this.http.get<ApiResponse<RoleResponse>>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  createRole(request: RoleRequest): Observable<RoleResponse> {
    return this.http.post<ApiResponse<RoleResponse>>(this.apiUrl, request).pipe(
      map(response => response.data)
    );
  }

  updateRole(id: number, request: RoleRequest): Observable<RoleResponse> {
    return this.http.put<ApiResponse<RoleResponse>>(`${this.apiUrl}/${id}`, request).pipe(
      map(response => response.data)
    );
  }

  deleteRole(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      map(() => undefined)
    );
  }

  getPermissions(): Observable<PermissionResponse[]> {
    return this.http.get<ApiResponse<PermissionResponse[]>>(this.permissionsUrl).pipe(
      map(response => response.data)
    );
  }

  getRolePermissions(id: number): Observable<PermissionResponse[]> {
    return this.http.get<ApiResponse<PermissionResponse[]>>(`${this.apiUrl}/${id}/permissions`).pipe(
      map(response => response.data)
    );
  }

  replaceRolePermissions(id: number, permissionIds: number[]): Observable<RoleResponse> {
    const request: AssignPermissionsRequest = { permissionIds };
    return this.http.put<ApiResponse<RoleResponse>>(`${this.apiUrl}/${id}/permissions`, request).pipe(
      map(response => response.data)
    );
  }
}
